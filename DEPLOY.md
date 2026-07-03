# Deploying Meridian

Standard Next.js 16 app. Production build passes; all secrets are git-ignored (`.env*`).

## Recommended — Vercel (free, full server, live data works)

1. Push to GitHub (already done → `github.com/priyadeepjaiswal9c/meridian`).
2. Go to **[vercel.com/new](https://vercel.com/new)** → **Import** the repo.
3. Framework auto-detects as **Next.js** — no config needed. Click **Deploy**.
4. Done → `https://meridian-<hash>.vercel.app`. Auto-redeploys on every push to `main`.

**Env vars:** none required. Live **AI** is the in-app *Connect AI* (user pastes their own free
Gemini key, stored in-browser). Optionally add free data keys in Vercel → Settings → Environment
Variables to enrich the live feed:

| Variable | Purpose |
|---|---|
| `EIA_API_KEY` | Live Brent/WTI — https://www.eia.gov/opendata/register.php |
| `AISSTREAM_API_KEY` | Live vessels — https://aisstream.io/ |

GDELT (news) and OFAC (sanctions) are keyless and work automatically.

## Why Vercel over GitHub Pages (honest note)

GitHub Pages only serves a **static export** — that would disable the server data routes (news,
sanctions, prices, vessels), force basePath rewrites, and drop the app to seeded-only. Vercel runs
the real Next.js server for free, so the hosted link behaves exactly like local. Same GitHub repo,
better host.

## Local run

```bash
npm install && npm run dev     # http://localhost:3000
```

**Shareable pre-triggered demo:** `/console?run=hormuz&i=70` auto-fires the Hormuz crisis on load —
handy for a recorded demo or a judge link.
