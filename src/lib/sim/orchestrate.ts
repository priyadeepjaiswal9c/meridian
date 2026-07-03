import type {
  AgentEvent,
  OrchestratorResult,
  Recommendation,
  Scenario,
  Severity,
} from "@/lib/types";
import { CORRIDORS, NATIONAL, refineryById, supplierById } from "@/lib/geo/india";
import { computeCascade } from "@/lib/sim/cascade";
import { baselineSignals, disruptedChokepoints, scenarioSignals } from "@/lib/data/seed";
import { clamp } from "@/lib/utils";

const GRADE_FIT: Record<string, number> = { sour: 0.95, medium: 0.9, sweet: 0.74 };

/** Rank alternative corridors that survive the disruption, then verify each. */
export function buildRecommendations(scenario: Scenario): Recommendation[] {
  if (scenario.kind === "baseline") return [];
  const disrupted = disruptedChokepoints(scenario);
  const i = scenario.intensity / 100;

  const candidates = CORRIDORS.filter(
    (c) => !c.chokepointIds.some((cp) => disrupted.includes(cp)),
  ).map((c) => {
    const supplier = supplierById(c.supplierId)!;
    const dest = refineryById(c.destRefineryId)!;
    const premiumUsdBbl = c.premiumUsdBbl + i * 1.8; // alternatives richen in a crisis
    const leadTimeDays = c.transitDays;
    const gradeFit = GRADE_FIT[c.grade];

    const complianceOk = supplier.id !== "russia";
    const compliance = complianceOk
      ? { ok: true, note: "No OFAC SDN match" }
      : { ok: false, note: "Exceeds G7 price cap — financing blocked" };
    const logistics =
      leadTimeDays > 30
        ? { ok: true, note: `Long transit ${leadTimeDays}d — bridge with SPR` }
        : { ok: true, note: "Port capacity & berth confirmed" };
    const finance =
      premiumUsdBbl > 3
        ? { ok: true, note: `Margin impact −$${premiumUsdBbl.toFixed(1)}/bbl` }
        : premiumUsdBbl < 0
          ? { ok: true, note: `Captures −$${Math.abs(premiumUsdBbl).toFixed(1)}/bbl discount` }
          : { ok: true, note: "Within hedging budget" };

    const score =
      0.42 * (1 - clamp(premiumUsdBbl / 6, -0.5, 1)) +
      0.28 * (1 - clamp(leadTimeDays / 40, 0, 1)) +
      0.3 * gradeFit;

    const confidence = clamp(gradeFit * 0.6 + (complianceOk ? 0.3 : 0) + 0.08, 0.3, 0.97);

    return {
      raw: c,
      supplier,
      dest,
      complianceOk,
      score,
      rec: {
        id: c.id,
        rank: 0,
        corridorId: c.id,
        sourceName: supplier.name,
        routeName: c.name,
        premiumUsdBbl,
        leadTimeDays,
        gradeFit,
        volumeMbbl: 2 + ((CORRIDORS.indexOf(c) % 3) + 1), // 3–5 mbbl cargoes
        verification: { compliance, logistics, finance },
        confidence,
        rationale: `${supplier.country} ${c.grade} crude into ${dest.name} (${dest.operator}); ${
          c.chokepointIds.length === 0 ? "Hormuz-bypass routing" : "open-corridor routing"
        }.`,
      } satisfies Recommendation,
    };
  });

  // verification-first: drop compliance failures, rank the rest, keep top 3
  const passing = candidates
    .filter((c) => c.complianceOk)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return passing.map((c, idx) => ({ ...c.rec, rank: idx + 1 }));
}

/** Candidates rejected by verification — surfaced in the agent trace as the differentiator. */
export function rejectedCandidates(scenario: Scenario): string[] {
  if (scenario.kind === "baseline") return [];
  const disrupted = disruptedChokepoints(scenario);
  return CORRIDORS.filter(
    (c) => !c.chokepointIds.some((cp) => disrupted.includes(cp)) && c.supplierId === "russia",
  ).map((c) => supplierById(c.supplierId)!.name);
}

function ev(phase: AgentEvent["phase"], agent: string, status: AgentEvent["status"], message: string): AgentEvent {
  return { id: `${phase}-${agent}-${status}-${Math.round(Math.random() * 1e6)}`, ts: Date.now(), phase, agent, status, message };
}

/** Scripted multi-agent timeline played out for the "live" reasoning feel. */
export function planAgentTimeline(scenario: Scenario): AgentEvent[] {
  if (scenario.kind === "baseline") {
    return [
      ev("sense", "Maritime", "thinking", "Scanning tanker tracks across 8 corridors…"),
      ev("sense", "Maritime", "done", "Traffic nominal — no anomalies."),
      ev("reason", "Risk Fusion", "done", "National risk index: LOW."),
    ];
  }
  const recs = buildRecommendations(scenario);
  const rejected = rejectedCandidates(scenario);
  const cascade = computeCascade(scenario);
  const atRisk = (cascade.supplyAtRiskBpd / 1_000_000).toFixed(2);

  const t: AgentEvent[] = [
    ev("sense", "Maritime", "thinking", "Ingesting AIS — 600+ tanker tracks…"),
    ev("sense", "Maritime", "alert", `AIS gaps detected near ${scenario.kind === "redsea" ? "Bab-el-Mandeb" : "Hormuz"}.`),
    ev("sense", "Geopolitical", "thinking", "Reading 2,148 GDELT events (15-min window)…"),
    ev("sense", "Geopolitical", "alert", "Conflict-tone spike on the exposed corridor."),
    ev("sense", "Market", "thinking", "Polling Brent/WTI + prompt spreads…"),
    ev("sense", "Market", "done", `Brent ${cascade.brentDeltaPct.toFixed(0)}% war premium pricing in.`),
    ev("sense", "Sanctions", "thinking", "Screening operators vs OFAC SDN…"),
    ev("sense", "Sanctions", "done", "1 operator flagged on an at-risk corridor."),
    ev("reason", "Risk Fusion", "thinking", "Debating interpretations (mechanical vs sanctions vs signal-loss)…"),
    ev("reason", "Risk Fusion", "done", `Consensus: disruption confirmed — ${atRisk} mb/d exposed.`),
    ev("reason", "Scenario Twin", "thinking", "Propagating cascade through the digital twin…"),
    ev("reason", "Scenario Twin", "done", `Brent→refinery→pump→GDP modelled (GDP ${cascade.gdpDeltaPct.toFixed(2)}%).`),
    ev("act", "Procurement", "thinking", "Ranking alternative crude corridors…"),
    ev("act", "Procurement", "done", `Found ${recs.length + rejected.length} candidate reroutes.`),
    ev("verify", "Compliance", "thinking", "Auditing candidates vs sanctions & price caps…"),
    ...(rejected.length
      ? [ev("verify", "Compliance", "alert", `Rejected ${rejected[0]} — G7 price-cap breach.`)]
      : []),
    ev("verify", "Logistics", "done", "Fujairah & Cape routes: capacity confirmed."),
    ev("verify", "Finance", "done", "Top reroute within hedging budget."),
    ev("act", "Orchestrator", "done", `Plan ready — ${recs.length} verified reroutes staged.`),
  ];
  return t;
}

function severityFromIndex(idx: number): Severity {
  if (idx >= 75) return "critical";
  if (idx >= 55) return "high";
  if (idx >= 35) return "elevated";
  return "low";
}

const RISK_BASE: Record<Scenario["kind"], number> = {
  baseline: 12, hormuz: 58, redsea: 47, opec: 42, custom: 50,
};

/** The full finalized result of a run (the local/deterministic brain). */
export function buildResult(scenario: Scenario, brent = NATIONAL.brentBaselineUsd): OrchestratorResult {
  const cascade = computeCascade(scenario, brent);
  const recommendations = buildRecommendations(scenario);
  const signals = [...scenarioSignals(scenario), ...baselineSignals()];

  const riskIndex =
    scenario.kind === "baseline"
      ? RISK_BASE.baseline
      : clamp(RISK_BASE[scenario.kind] * (0.45 + 0.55 * (scenario.intensity / 100)), 0, 99);
  const severity = severityFromIndex(riskIndex);

  const atRisk = (cascade.supplyAtRiskBpd / 1_000_000).toFixed(2);
  const headline =
    scenario.kind === "baseline"
      ? "All corridors nominal — national energy risk LOW."
      : `${scenario.label} @ ${scenario.intensity}% — ${atRisk} mb/d exposed; ${recommendations.length} verified reroutes staged.`;

  return { signals: scenario.kind === "baseline" ? baselineSignals() : signals, cascade, recommendations, headline, riskIndex, severity };
}
