/**
 * Harness adapter: PDT AI agents (G2G / OffGamers / pipwave delivery pipeline).
 *
 * Not a coding harness. Each astronaut is one PDT n8n workflow that uses AI, and each zone is
 * one AI team: Product AI, BA AI, UI UX AI, DEV AI and QA AI. The data comes from the n8n
 * workflow "PDT · 56 · AI Agents Live", which reads n8n's own run history and answers in a few
 * hundred bytes per workflow.
 *
 *   running   → the workflow is running right now        (the astronaut hammers)
 *   hasError  → its last finished run failed             (slumps, red eyes)
 *   no run in 3 days                                      (sits down and sleeps)
 *   anything else                                          (potters around its plot)
 *
 * Read-only, like every adapter: it only reads the feed. "Open" hands the workflow's n8n page
 * to the browser; nothing is ever started, changed or archived in n8n from here.
 *
 * Needs the company VPN, because n8n is only reachable on it.
 *
 * Settings (environment variables):
 *   PDT_AGENTS_FEED   the live feed URL (default below)
 *   PDT_AGENTS_MOCK   path to a JSON file shaped like the feed, for testing without the VPN
 *
 * 8 Oct 2026, for Jinny Tiow (Product Delivery Lead).
 */
import fsp from 'node:fs/promises'

const FEED = process.env.PDT_AGENTS_FEED || 'https://hydron.pdt-app.dynamicpodium.com/slack/pdt-ai-live'
const MOCK = process.env.PDT_AGENTS_MOCK || ''
const N8N = 'https://hydron.pdt-app.dynamicpodium.com'
/** The colony polls every few seconds. n8n is shared, so ask it at most twice a minute. */
const CACHE_MS = 30 * 1000

const TEAMS = {
  product: 'Product AI',
  ba: 'BA AI',
  uiux: 'UI UX AI',
  dev: 'DEV AI',
  qa: 'QA AI'
}
const ROLE = {
  product: 'Product AI: grills the HOD, recommends a decision',
  ba: 'BA AI: writes PRDs, briefs and stories',
  uiux: 'UI UX AI: briefs, wireframes and Figma checks',
  dev: 'DEV AI: sizes work, writes tech briefs, pushes PRDs to GitLab',
  qa: 'QA AI: test cases, Playwright runs, bugs'
}

let cache = { at: 0, data: null }

async function load() {
  if (cache.data && Date.now() - cache.at < CACHE_MS) return cache.data
  let data
  if (MOCK) data = JSON.parse(await fsp.readFile(MOCK, 'utf8'))
  else {
    const res = await fetch(FEED, { signal: AbortSignal.timeout(15000), headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`PDT agents feed answered ${res.status}. Is the VPN on?`)
    data = await res.json()
  }
  cache = { at: Date.now(), data }
  return data
}

async function detect() {
  if (MOCK) return true
  try {
    await load()
    return true
  } catch {
    return false
  }
}

async function scanThreads() {
  const data = await load()
  const out = []
  for (const w of data.workflows || []) {
    const team = TEAMS[w.agent]
    if (!team) continue
    const last = w.lastRunAt ? Date.parse(w.lastRunAt) : 0
    const runs = Number(w.runs || 0)
    const errs = Number(w.errors || 0)
    out.push({
      id: `pdt-agents:${w.id}`,
      title: String(w.name || w.id).replace(/^PDT · /, ''),
      preview: `${ROLE[w.agent]}. Last ${data.windowHours || 3} hours: ${runs} run${runs === 1 ? '' : 's'}, ${errs} error${errs === 1 ? '' : 's'}.${w.lastError ? ' Last error: ' + w.lastError : ''}`,
      project: team,
      projectPath: `/pdt-agents/${w.agent}`,
      worktree: '',
      cwd: `/pdt-agents/${w.agent}`,
      gitBranch: w.active ? 'live' : 'switched off',
      model: w.lastStatus ? `last run: ${w.lastStatus}` : 'no run in the window',
      effort: '',
      createdAt: w.createdAt ? Date.parse(w.createdAt) : last,
      lastActivityAt: last,
      lastFocusedAt: last,
      running: !!w.running,
      unread: false,
      hasError: w.lastStatus === 'error' || w.lastStatus === 'crashed',
      archived: !w.active,
      // How finished a building looks, on a log scale: busier workflows have bigger bases.
      sizeBytes: 40000 + Number(w.totalRuns || runs) * 20000,
      source: 'n8n',
      canOpen: true,
      ref: { id: w.id }
    })
  }
  return out
}

function openThread(ref) {
  if (!ref || !/^[A-Za-z0-9]+$/.test(String(ref.id || ''))) return { ok: false, error: 'Unknown workflow.' }
  return { ok: true, url: `${N8N}/workflow/${ref.id}` }
}

function newSession() {
  return { ok: false, error: 'PDT agents are started by their own schedules, not from here.' }
}

export default { id: 'pdt-agents', name: 'PDT AI agents', detect, scanThreads, openThread, newSession }
