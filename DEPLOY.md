# Deploying Meridian

The app is a standard Next.js 16 app and is **deploy-ready** — the production build passes and
all secrets are git-ignored (`.env*`). Pick either path.

## Option A — Vercel CLI (fastest)

```bash
cd meridian
npm i -g vercel          # one-time
vercel                   # log in (browser) + create a preview deployment
vercel --prod            # promote to a production URL
```

## Option B — GitHub → Vercel (best for a shareable link + auto-deploys)

1. Push the repo to GitHub.
2. Go to https://vercel.com/new and **Import** the repo (root = `meridian/`).
3. Framework auto-detects as **Next.js** — no config needed. Click **Deploy**.

## Environment variables (all optional, all free)

Add these in **Vercel → Project → Settings → Environment Variables** to go from
`SEEDED` to `LIVE`. The app runs fully without them.

| Variable | Purpose |
|---|---|
| `EIA_API_KEY` | Live Brent/WTI prices — https://www.eia.gov/opendata/register.php |
| `AISSTREAM_API_KEY` | Live tanker positions — https://aisstream.io/ |
| `ANTHROPIC_API_KEY` | Opt-in Claude reasoning (small per-run cost) |

GDELT (news) and OFAC (sanctions) are keyless and work automatically wherever there's network.

## Notes

- **CARTO basemap & GDELT** are called client/server-side at runtime — the deploy host needs
  outbound network (Vercel has it).
- The OFAC SDN download is large; on serverless it may exceed the function time budget and fall
  back to seeded counts — that's expected and safe.
- **Demo link:** share a pre-triggered run with `?run=hormuz&i=70` (auto-fires the crisis on load).
