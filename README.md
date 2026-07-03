# 🌐 Meridian — National Energy Supply-Chain Resilience Intelligence

> **ET AI Hackathon 2.0 · Problem #2 — Energy Supply Chain Resilience for Import-Dependent Economies**

**Incumbents (Kpler, Vortexa, Everstream) give you _signals_. Meridian _closes the loop_** —
it **senses** geopolitical & maritime risk, **reasons** over a transparent economic cascade,
**acts** with ranked crude-procurement reroutes, and **verifies** each one against sanctions,
logistics and finance before it ever reaches a human — turning a geopolitical shock into an
executable, auditable plan in seconds.

India imports **88% of its crude**, ~**42% through the Strait of Hormuz**, on just **~9.5 days**
of strategic reserve. Today that risk is watched on dashboards. Meridian acts on it.

---

## ⚡ Quickstart

```bash
cd meridian
npm install
npm run dev          # → http://localhost:3000
```

Open the app and hit **SIMULATE CRISIS**. That's the whole demo — no keys required.

### Optional: go LIVE (all free, no charge ever)
Copy `.env.example` → `.env.local` and add any of these free-signup keys. Without them, the app
runs on realistic seeded data and the badge reads **SEEDED**; with them it reads **LIVE**.

| Key | Unlocks | Get it (free) |
|---|---|---|
| `EIA_API_KEY` | Live Brent/WTI spot prices | https://www.eia.gov/opendata/register.php |
| `AISSTREAM_API_KEY` | Live tanker positions | https://aisstream.io/ |
| `ANTHROPIC_API_KEY` | **Opt-in** real Claude multi-agent reasoning (costs a few ¢/run) | https://console.anthropic.com/ |

GDELT (geopolitical news) and OFAC (sanctions) are **keyless** and wire up automatically.

---

## 🧠 How it works — sense → reason → act → verify

```
        SENSE                 REASON                ACT                  VERIFY
 ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
 │ Geopolitical(GDELT)│  │ Risk Fusion       │  │ Procurement       │  │ Compliance        │
 │ Maritime (AIS)     │→ │ Scenario Twin     │→ │  Orchestrator     │→ │ Logistics         │
 │ Market (EIA)       │  │ (causal cascade)  │  │ Reserve Optimiser │  │ Finance           │
 │ Sanctions (OFAC)   │  └──────────────────┘  └──────────────────┘  └──────────────────┘
 └───────────────────┘     transparent math       ranked reroutes        audit + reject
```

- **The cascade is not a black box.** Every number — supply-at-risk → Brent → refinery
  utilisation → pump price → GDP → reserve cover — is derived from explicit, on-screen
  assumptions (`src/lib/sim/cascade.ts`). Judges can audit it.
- **The verification layer is the moat.** Before a reroute is shown, Compliance/Logistics/Finance
  checks run. In the demo, the cheapest barrels (Russian Urals) are **rejected on a G7 price-cap
  breach** and the **Fujairah Hormuz-bypass** is promoted — the decision a regulated industry needs.

---

## 🎬 3-minute demo script

1. **(0:25)** Calm map — tankers through Hormuz, refineries lit, *Risk: LOW*. "88% imported, 42% through this strait, 9.5 days of reserve."
2. **(1:00)** Signals stream in (GDELT/AIS) → agents flag the corridor. "We read thousands of events + vessel tracks and flagged it before any analyst."
3. **(1:45)** Hit **Simulate** → map floods red, cascade animates (Brent +25%, GDP −0.4%). "Incumbents stop here — they show you the problem."
4. **(2:30)** Orchestrator acts: 3 ranked reroutes, all verified ✓✓✓; Russia auto-rejected. "We close the loop — executable, auditable, in seconds."
5. **(3:00)** Impact: faster recovery, ₹ saved; buyers = refiners / government / ports; generalises to any commodity.

---

## 📊 Judging-criteria fit

| Criterion | How Meridian wins it |
|---|---|
| **Relevance** | Solves the exact brief on India's real refineries, corridors & chokepoints |
| **Innovation** | Close-the-loop agent + verification layer — not another dashboard |
| **Technical** | Multi-agent orchestration + transparent causal twin + real data connectors |
| **Business** | Clear buyers (refiners, govt, ports) and a quantified ₹ cost of inaction |
| **Presentation** | A cinematic, single-click crisis demo |
| **Impact/Scale** | National energy security; generalises to any import-dependent commodity |

---

## 🛠 Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · **deck.gl + MapLibre** (digital-twin map) ·
**Framer Motion** · bespoke SVG data-viz · Radix · Zustand. Data: EIA (key), GDELT (keyless),
OFAC (keyless), AISStream (key; positions burst-sampled server-side), PPAC reference data,
CARTO basemaps. AI: Anthropic SDK — **opt-in** Claude synthesis via `/api/agent`; without a key
the deterministic orchestrator runs everything for free.

```
src/
  app/            # page (HUD over the map) + /api/data/* connectors
  components/     # map/, shell/, panels/, ui/
  lib/
    geo/india.ts  # real refineries, corridors, chokepoints, suppliers
    sim/          # transparent cascade model + deterministic orchestrator
    data/         # seeded fallbacks
    store.ts      # zustand app state
```

> **Integrity note:** chokepoint closures are presented as *simulated scenarios*, not claims about
> live real-world events. The cascade's assumptions are shown on screen for audit.
