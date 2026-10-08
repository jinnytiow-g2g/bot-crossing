# PDT AI agents in Bot Crossing (private test)

Each astronaut is one PDT n8n workflow that uses AI. Each zone is one AI team:
Product AI, BA AI, UI UX AI, DEV AI and QA AI.

| The astronaut is | It means |
| --- | --- |
| Hammering, with sparks | That workflow is running right now |
| Slumped, red eyes | Its last run failed |
| Sitting asleep | It has not run for 3 days |
| Walking around | Normal, waiting for its next run |

Click an astronaut to see what it does, and "Open" to go to that workflow in n8n.

## Run it on your Mac

You need the company VPN on, and Node 22 or newer (download the macOS installer from nodejs.org once).

Open Terminal and paste:

```
cd ~/Downloads
curl -L -o bot-crossing.zip https://github.com/jinnytiow-g2g/bot-crossing/archive/refs/heads/pdt-agents.zip
unzip -q -o bot-crossing.zip
cd bot-crossing-pdt-agents
npm install
npm run pdt
```

The colony opens in your browser at http://localhost:5274. To stop it, go back to Terminal and press Ctrl+C.
Next time, you only need the last two lines (`cd ~/Downloads/bot-crossing-pdt-agents` then `npm run pdt`).

## Where the data comes from

`server/harnesses/pdt-agents.mjs` reads the n8n workflow **PDT · 56 · AI Agents Live**
(`/slack/pdt-ai-live`). That workflow reads n8n's own run history and reuses its answer for
30 seconds, so the colony asks n8n at most twice a minute. Nothing in n8n is changed from here.

Built 8 Oct 2026 for Jinny Tiow. Bot Crossing itself is by Jarren Rocks (MIT); art by Kay Lousberg (CC0).
