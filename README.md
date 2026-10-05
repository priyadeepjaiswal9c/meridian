# Meridian — National Energy Supply-Chain Resilience Intelligence

> **ET AI Hackathon 2.0 · Problem #2 — Energy Supply Chain Resilience for Import-Dependent Economies**

**Incumbents (Kpler, Vortexa, Everstream) give you *signals*. Meridian *closes the loop*** — it
**senses** geopolitical & maritime risk, **reasons** over a transparent economic cascade, **acts**
with ranked crude-procurement reroutes, and **verifies** each one against sanctions, logistics and
finance before it ever reaches a human. A geopolitical shock becomes an executable, auditable plan
in seconds.

India imports **88% of its crude**, ~**42% through the Strait of Hormuz**, on ~**9.5 days** of
strategic reserve. Today that risk is watched on dashboards. Meridian acts on it.

---

## Two acts

**Act I — The Brief** (`/`) — a scroll-driven story: an interactive **COBE globe** of India's crude
corridors (red = via Hormuz), the exposure in three counting numbers, and the 2025 Brent shock
drawn live as you scroll. Ends: *Enter the console.*

**Act II — The Console** (`/console`) — a directed intelligence workspace. Hit **Simulate** and the
app takes the wheel: the camera flies to the chokepoint, a crisis ripple fires, signals cascade in,
and the map pulls back as **verified reroute arcs draw themselves** across the ocean. Every panel is
**collapsible + enlargeable**, the map is fully pan/zoom/tilt, **⌘K** opens a command palette, and
**Approve** actually commits the cargo (risk index eases, arc thickens, charter issued).

---

## Quickstart

```bash
npm install
npm run dev          # → http://localhost:3000
```

Open `/`, scroll the story, click **Enter the console**, then **Simulate crisis** (or press **⌘K**).
Runs fully on the deterministic core — **no keys required**.

### Optional live upgrades (all free)
- **Live data** — the console's data connectors (GDELT news, OFAC sanctions are keyless; EIA prices,
  AISStream vessels use free-signup keys) light up automatically when reachable; the badge flips
  **Seeded → Live**. Add keys in `.env.local` (see `.env.example`).
- **Live AI** — click **Connect AI** in the console and paste a free
  [Google Gemini key](https://aistudio.google.com/apikey). The LLM then writes the executive brief
  live during a run. The key stays **only in your browser** — never sent to any server or committed.

---

## Deploy

**Recommended: Vercel (free, full server).** Import this repo at
[vercel.com/new](https://vercel.com/new) → Deploy. Next.js is auto-detected; no env vars required
(live AI is the in-app Connect AI). Live data routes work server-side on Vercel. See `DEPLOY.md`.

---

## How it works — sense → reason → act → verify

- **The cascade is auditable.** Supply-at-risk → Brent → refinery utilisation → pump price → GDP →
  reserve cover — every number derives from explicit, on-screen assumptions (`src/lib/sim/cascade.ts`).
- **The verification layer is the moat.** Before a reroute is shown, Compliance/Logistics/Finance
  checks run. In the demo the cheapest barrels (Russian Urals) are **rejected on a G7 price-cap
  breach** and the **Fujairah Hormuz-bypass** is promoted — the decision a regulated industry needs.

---

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind v4 · **deck.gl + MapLibre** (digital twin) · **COBE**
(globe) · **GSAP ScrollTrigger + Lenis** (scroll story) · Framer Motion · **cmdk** · **sonner** ·
NumberFlow · Zustand. Data: EIA, GDELT, OFAC, AISStream, PPAC, CARTO. AI: opt-in client-side Gemini.
Fonts: Fraunces (display) · Inter (UI) · Geist Mono (data).

```
src/
  app/            # / (landing) · /console · /api/data/* connectors
  components/     # landing/ · map/ · panels/ · console/ · shell/ · ui/
  lib/
    geo/india.ts  # real refineries, corridors, chokepoints, suppliers
    sim/          # transparent cascade model + deterministic orchestrator
    llm.ts        # opt-in client-side Gemini synthesis
    store.ts      # zustand app state (theme, director, approvals…)
```

Deliverables: this app · pitch deck (`public/pitch.html` → `/pitch.html`, print-to-PDF) ·
runtime architecture diagram ([`docs/architecture.svg`](docs/architecture.svg), also served live at
[`/architecture.svg`](https://meridian-five-phi.vercel.app/architecture.svg) and included as slide 9
of the deck).

> **Integrity note:** chokepoint closures are presented as *simulated scenarios*, not claims about
> live real-world events. The cascade's assumptions are shown on screen for audit.

## Contributors

| Contributor | Role |
|---|---|
| [**Priyadeep Jaiswal**](https://github.com/priyadeepjaiswal9c) | Owner; product concept, research, system design, implementation, and presentation |

Priyadeep designed the decision model, integrated the data and interface, verified the scenarios, and owns the resulting work.

## Interactive console tutorial

Open the [guided console](https://meridian-five-phi.vercel.app/console?tutorial=1) for the six-step walkthrough, or click **Tutorial** in the console header. It highlights the actual controls, waits for a simulation and a demo approval, then compares the saved run with another intensity. Close it at any time to return to the signal feed.

For a short interview demo: choose **Hormuz**, set **50%**, run, read **Cascade impact**, inspect the route cards, simulate one approval, then compare **30%** with **80%**. The tutorial explains each action in place.

The impact calculations and route ranking use explicit formulas and preset checks. The agent sequence is scripted; optional Gemini adds a written summary. Approvals change browser state only and send no procurement orders. The tutorial calls out these boundaries, including the formula-based confidence score and fixed risk-index reduction.
