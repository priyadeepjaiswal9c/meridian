// Domain model for Meridian — National Energy Supply-Chain Resilience Intelligence.

export type Severity = "low" | "elevated" | "high" | "critical";

export type Coord = [number, number]; // [lng, lat]

export interface Refinery {
  id: string;
  name: string;
  operator: string;
  lng: number;
  lat: number;
  capacityMMTPA: number;
  coast: "west" | "east" | "inland";
  /** crude grades this refinery is configured to run well */
  grades: ("sour" | "medium" | "sweet")[];
}

export interface Port {
  id: string;
  name: string;
  lng: number;
  lat: number;
  coast: "west" | "east";
}

export interface Chokepoint {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** approx share of India's crude imports transiting here */
  indiaCrudeSharePct: number;
  note: string;
}

export interface SupplierRegion {
  id: string;
  name: string; // e.g. "Saudi Arabia — Ras Tanura"
  country: string;
  lng: number;
  lat: number;
  grade: "sour" | "medium" | "sweet";
  apiGravity: number;
}

export interface Corridor {
  id: string;
  name: string;
  supplierId: string;
  destRefineryId: string;
  /** ordered waypoints [supplier, ...via, destination] for the map arc */
  path: Coord[];
  chokepointIds: string[];
  baselineSharePct: number; // share of India crude on this corridor at baseline
  transitDays: number;
  grade: "sour" | "medium" | "sweet";
  /** indicative laden premium vs Brent, $/bbl, at baseline */
  premiumUsdBbl: number;
}

/** A real vessel position sampled live from AISStream. */
export interface LiveVessel {
  id: string;
  lng: number;
  lat: number;
  heading: number;
}

export interface Vessel {
  id: string;
  name: string;
  lng: number;
  lat: number;
  heading: number; // degrees
  class: "VLCC" | "Suezmax" | "Aframax";
  status: "laden" | "ballast" | "dark";
  corridorId?: string;
  /** 0..1 progress along its corridor path, for animation */
  t: number;
}

export interface RiskSignal {
  id: string;
  ts: number;
  source: "GDELT" | "AIS" | "MARKET" | "SANCTIONS";
  title: string;
  detail: string;
  corridorId?: string;
  chokepointId?: string;
  severity: Severity;
  confidence: number; // 0..1
}

export type ScenarioKind = "baseline" | "hormuz" | "redsea" | "opec" | "custom";

export interface Scenario {
  kind: ScenarioKind;
  label: string;
  /** intensity of the shock, 0..100 (e.g. % closure / % cut) */
  intensity: number;
  description: string;
}

export interface CascadeStep {
  id: string;
  label: string;
  value: string;
  deltaPct?: number;
  tone: Severity;
  detail: string;
}

export interface CascadeAssumption {
  id: string;
  label: string;
  value: string;
}

export interface CascadeResult {
  scenario: Scenario;
  brentBaseline: number;
  brentShocked: number;
  brentDeltaPct: number;
  supplyAtRiskBpd: number;
  refineryUtilDeltaPct: number;
  pumpPriceDeltaInr: number;
  gdpDeltaPct: number;
  reserveDaysBaseline: number;
  reserveDaysAfter: number;
  /** indicative national economic cost of a sustained shock, ₹ crore */
  econCostCrore: number;
  steps: CascadeStep[];
  assumptions: CascadeAssumption[];
}

export type VerifyKey = "compliance" | "logistics" | "finance";
export interface VerifyState {
  ok: boolean;
  note: string;
}

export interface Recommendation {
  id: string;
  rank: number;
  corridorId: string;
  sourceName: string;
  routeName: string;
  premiumUsdBbl: number;
  leadTimeDays: number;
  gradeFit: number; // 0..1, fit to at-risk refinery slates
  volumeMbbl: number; // million barrels
  verification: Record<VerifyKey, VerifyState>;
  confidence: number; // 0..1
  rationale: string;
}

export type AgentPhase = "sense" | "reason" | "act" | "verify";
export type AgentStatus = "thinking" | "done" | "alert";

export interface AgentEvent {
  id: string;
  ts: number;
  phase: AgentPhase;
  agent: string;
  status: AgentStatus;
  message: string;
}

/** The full result of one orchestrator run, streamed then finalized. */
export interface OrchestratorResult {
  signals: RiskSignal[];
  cascade: CascadeResult;
  recommendations: Recommendation[];
  headline: string;
  riskIndex: number; // 0..100 national energy risk index
  severity: Severity;
}
