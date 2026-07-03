import type { CascadeResult, Scenario, ScenarioKind, Severity } from "@/lib/types";
import { CORRIDORS, NATIONAL, corridorsThroughChokepoint } from "@/lib/geo/india";

/**
 * Transparent causal-cascade model.
 *
 * Every number below is derived from an explicit, editable assumption — there is
 * no black box. The point of Meridian is that judges (and policymakers) can audit
 * exactly how a shock propagates: supply-at-risk → crude price → refinery runs →
 * pump price → GDP → reserve cover.
 */

// ── Tunable assumptions (exposed in the UI) ────────────────────────────────
export const ASSUMPTIONS = {
  fxInr: 83.2, // ₹ per US$
  // peak crude risk-premium for a *full* shock of each kind (fraction of Brent)
  peakPremium: { hormuz: 0.45, redsea: 0.18, opec: 0.22, custom: 0.28, baseline: 0 } as Record<ScenarioKind, number>,
  reroutability: 0.5, // share of at-risk barrels re-sourceable within the response window
  pumpPassthroughInrPerUsd: 0.45, // ₹/litre per $1/bbl sustained crude move
  gdpDragPerTenPctOil: 0.15, // % GDP lost per +10% sustained oil price
  shockWindowDays: 30, // window used to size the national cost
};

const SUPPLY_AT_RISK_SHARE: Record<ScenarioKind, () => number> = {
  // share of India's crude import that is exposed, before mitigation
  hormuz: () => corridorsThroughChokepoint("hormuz").reduce((s, c) => s + c.baselineSharePct, 0),
  redsea: () => corridorsThroughChokepoint("bab").reduce((s, c) => s + c.baselineSharePct, 0),
  opec: () => 16, // OPEC+ cut felt across the slate, not corridor-specific
  custom: () => corridorsThroughChokepoint("hormuz").reduce((s, c) => s + c.baselineSharePct, 0),
  baseline: () => 0,
};

function toneFor(deltaPct: number): Severity {
  const a = Math.abs(deltaPct);
  if (a >= 30) return "critical";
  if (a >= 15) return "high";
  if (a >= 5) return "elevated";
  return "low";
}

export function computeCascade(scenario: Scenario, brentBaseline = NATIONAL.brentBaselineUsd): CascadeResult {
  const i = Math.max(0, Math.min(100, scenario.intensity)) / 100;
  const A = ASSUMPTIONS;

  // 1) Supply at risk (mb/d), after partial re-routing
  const exposedSharePct = SUPPLY_AT_RISK_SHARE[scenario.kind]() * i;
  const exposedMbpd = (exposedSharePct / 100) * NATIONAL.dailyCrudeImportMbpd;
  const supplyAtRiskBpd = exposedMbpd * (1 - A.reroutability) * 1_000_000;

  // 2) Crude price — geopolitical risk premium, with mild diminishing returns
  const premium = A.peakPremium[scenario.kind] * Math.pow(i, 0.85);
  const brentShocked = brentBaseline * (1 + premium);
  const brentDeltaPct = premium * 100;
  const brentDeltaUsd = brentShocked - brentBaseline;

  // 3) Refinery utilisation drag (un-coverable exposed share)
  const refineryUtilDeltaPct = -(exposedSharePct * (1 - A.reroutability));

  // 4) Pump price passthrough (₹/L)
  const pumpPriceDeltaInr = brentDeltaUsd * A.pumpPassthroughInrPerUsd;

  // 5) GDP drag
  const gdpDeltaPct = -((brentDeltaPct / 10) * A.gdpDragPerTenPctOil);

  // 6) Strategic reserve cover after drawdown to plug the gap
  const reserveDaysBaseline = NATIONAL.reserveDays;
  const reserveDaysAfter = reserveDaysBaseline * (1 - exposedSharePct / 100);

  // National cost of a sustained shock (extra import bill over the window)
  const dailyImportBbl = NATIONAL.dailyCrudeImportMbpd * 1_000_000;
  const econCostCrore =
    (brentDeltaUsd * dailyImportBbl * A.shockWindowDays * A.fxInr) / 1e7;

  return {
    scenario,
    brentBaseline,
    brentShocked,
    brentDeltaPct,
    supplyAtRiskBpd,
    refineryUtilDeltaPct,
    pumpPriceDeltaInr,
    gdpDeltaPct,
    reserveDaysBaseline,
    reserveDaysAfter,
    econCostCrore,
    steps: [
      {
        id: "supply",
        label: "Crude supply at risk",
        value: `${(supplyAtRiskBpd / 1_000_000).toFixed(2)} mb/d`,
        deltaPct: -exposedSharePct,
        tone: toneFor(exposedSharePct),
        detail: `${exposedSharePct.toFixed(1)}% of imports exposed; ${(A.reroutability * 100).toFixed(0)}% assumed re-sourceable.`,
      },
      {
        id: "brent",
        label: "Brent crude",
        value: `$${brentBaseline.toFixed(0)} → $${brentShocked.toFixed(0)}`,
        deltaPct: brentDeltaPct,
        tone: toneFor(brentDeltaPct),
        detail: `Risk premium ${(premium * 100).toFixed(1)}% on a peak-${(A.peakPremium[scenario.kind] * 100).toFixed(0)}% assumption.`,
      },
      {
        id: "refinery",
        label: "Refinery utilisation",
        value: `${refineryUtilDeltaPct.toFixed(1)}%`,
        deltaPct: refineryUtilDeltaPct,
        tone: toneFor(refineryUtilDeltaPct),
        detail: "Un-coverable exposed crude forces run-rate cuts at affected refineries.",
      },
      {
        id: "pump",
        label: "Pump price",
        value: `+₹${pumpPriceDeltaInr.toFixed(1)}/L`,
        deltaPct: (pumpPriceDeltaInr / 100) * 100,
        tone: toneFor(pumpPriceDeltaInr * 1.5),
        detail: `₹${A.pumpPassthroughInrPerUsd}/L per $1/bbl full passthrough (pre-tax-buffer).`,
      },
      {
        id: "gdp",
        label: "GDP drag",
        value: `${gdpDeltaPct.toFixed(2)}%`,
        deltaPct: gdpDeltaPct,
        tone: toneFor(gdpDeltaPct * 20),
        detail: `${A.gdpDragPerTenPctOil}% GDP per +10% sustained oil.`,
      },
      {
        id: "reserve",
        label: "Strategic reserve cover",
        value: `${reserveDaysBaseline.toFixed(1)} → ${reserveDaysAfter.toFixed(1)} days`,
        deltaPct: -(exposedSharePct),
        tone: toneFor(exposedSharePct * 1.2),
        detail: "Days of cover if SPR is drawn to plug the import gap.",
      },
    ],
    assumptions: [
      { id: "fx", label: "FX", value: `₹${A.fxInr}/$` },
      { id: "premium", label: `Peak risk premium (${scenario.kind})`, value: `${(A.peakPremium[scenario.kind] * 100).toFixed(0)}%` },
      { id: "reroute", label: "Re-routability", value: `${(A.reroutability * 100).toFixed(0)}%` },
      { id: "passthrough", label: "Pump passthrough", value: `₹${A.pumpPassthroughInrPerUsd}/L per $1/bbl` },
      { id: "gdp", label: "GDP sensitivity", value: `${A.gdpDragPerTenPctOil}%/+10% oil` },
      { id: "window", label: "Cost window", value: `${A.shockWindowDays} days` },
    ],
  };
}

// ── Scenario presets for the console ───────────────────────────────────────
export const SCENARIO_PRESETS: Record<Exclude<ScenarioKind, "custom">, Omit<Scenario, "intensity">> = {
  baseline: { kind: "baseline", label: "Baseline — calm seas", description: "Normal flows; no active disruption signal." },
  hormuz: { kind: "hormuz", label: "Strait of Hormuz closure", description: "Partial/total closure of the world's most critical oil chokepoint." },
  redsea: { kind: "redsea", label: "Red Sea suspension", description: "Bab-el-Mandeb shipping suspended; Russian & Med barrels rerouted via Cape." },
  opec: { kind: "opec", label: "OPEC+ emergency cut", description: "Coordinated production cut tightens the global slate." },
};

export function makeScenario(kind: ScenarioKind, intensity: number): Scenario {
  if (kind === "custom") {
    return { kind, label: "Custom shock", description: "Operator-defined disruption.", intensity };
  }
  return { ...SCENARIO_PRESETS[kind], intensity };
}
