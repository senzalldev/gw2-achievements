# ⚔️ GW2 Achievement Tracker

**Your personal Guild Wars 2 achievement companion — no install, no login, runs entirely in your browser.**

[![Live App](https://img.shields.io/badge/Live_App-tracker.senzall.com-f59e0b?style=for-the-badge&logoColor=white)](https://tracker.senzall.com)
[![Ko-fi](https://img.shields.io/badge/Support_on-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/senzall)

---

## What It Does

The tracker connects to the official Guild Wars 2 API using your personal API key and gives you a smarter view of your achievement progress than the in-game panel allows.

- 🏃 **Almost Done** — achievements you're closest to completing, sorted by progress
- 💎 **Most Valuable** — incomplete achievements with the most AP still on the table
- 🎯 **Goals** — smart filters for mastery points, titles, skins, and repeatables
- 🔍 **Browse All** — full searchable list with content group, status, and type filters
- 📅 **Daily** — Wizard's Vault objectives, world bosses, map chests, dungeons, and raids
- 🌟 **Masteries** — track your mastery point progress across all regions
- 🔑 **Multi-account** — save and switch between multiple API keys instantly
- 🔒 **Zero backend** — your key never leaves your browser

---

## Privacy & API Key

Your GW2 API key is stored in your browser's `localStorage`. It never leaves your device except to make requests directly to `api.guildwars2.com`. There is no server, no database, and no account behind this app.

**Permission needed:** only `Progression` — create a key at [account.arena.net/applications](https://account.arena.net/applications).

---

## Tech Stack

| Tool | Role |
|------|------|
| Vue 3 | UI framework (Composition API) |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Chart.js | Donut & bar charts |
| GitHub Actions | CI/CD to Cloudflare Pages |

---

## Development

```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build → dist/
```

---

## Licence

[CC BY-NC 4.0](LICENSE) — free to use and adapt, not for commercial use.

---

## Support

If the tracker has helped you chip away at that achievement backlog, a coffee is always appreciated!

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/senzall)
