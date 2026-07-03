import type { Coord, RiskSignal, Scenario, Severity, Vessel } from "@/lib/types";
import { CORRIDORS, chokepointById, corridorById } from "@/lib/geo/india";
import { clamp } from "@/lib/utils";

/** Position + heading at fraction t along a polyline (euclidean lng/lat is fine for viz). */
export function pointAlongPath(path: Coord[], t: number): [number, number, number] {
  if (path.length === 1) return [path[0][0], path[0][1], 0];
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let dist = t * total;
  let i = 0;
  while (i < segs.length && dist > segs[i]) {
    dist -= segs[i];
    i++;
  }
  i = Math.min(i, segs.length - 1);
  const a = path[i];
  const b = path[i + 1];
  const f = segs[i] ? dist / segs[i] : 0;
  const lng = a[0] + (b[0] - a[0]) * f;
  const lat = a[1] + (b[1] - a[1]) * f;
  const heading = ((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI + 360) % 360;
  return [lng, lat, heading];
}

const VESSEL_NAMES = [
  "Gulf Pioneer", "Desh Vaibhav", "Swarna Mala", "New Diamond", "Maran Apollo",
  "Sea Empress", "Kamome Victoria", "Aravali", "Bonny Spirit", "Atlantic Pearl",
  "Santos Star", "Caspian Dawn", "Persian Light", "Karnaphuli", "Mahanadi",
  "Bharat Glory", "Ratna Setu", "Nordic Voyager", "Eastern Sun", "Cape Trader",
];

const CLASSES: Vessel["class"][] = ["VLCC", "Suezmax", "Aframax"];

/** Deterministic vessel placement along every corridor (stable across SSR/CSR). */
export function generateVessels(): Vessel[] {
  const vessels: Vessel[] = [];
  let nameIdx = 0;
  CORRIDORS.forEach((c, ci) => {
    const n = c.baselineSharePct >= 14 ? 3 : c.baselineSharePct >= 6 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const base = (k + 1) / (n + 1);
      const t = clamp(base + (ci % 2 ? 0.06 : -0.05), 0.03, 0.97);
      const [lng, lat, heading] = pointAlongPath(c.path, t);
      vessels.push({
        id: `${c.id}-v${k}`,
        name: `MT ${VESSEL_NAMES[nameIdx++ % VESSEL_NAMES.length]}`,
        lng,
        lat,
        heading,
        class: CLASSES[(ci + k) % CLASSES.length],
        status: "laden",
        corridorId: c.id,
        t,
      });
    }
  });
  return vessels;
}

let sid = 0;
const sig = (s: Omit<RiskSignal, "id" | "ts">): RiskSignal => ({
  ...s,
  id: `sig-${sid++}`,
  ts: Date.now(),
});

/** Ambient low-level signals shown at baseline. */
export function baselineSignals(): RiskSignal[] {
  return [
    sig({ source: "MARKET", title: "Brent steady in $80s", detail: "Front-month range-bound; contango flat.", severity: "low", confidence: 0.9 }),
    sig({ source: "AIS", title: "Nominal tanker traffic at Hormuz", detail: "Transit cadence within seasonal norms.", severity: "low", confidence: 0.85, chokepointId: "hormuz" }),
    sig({ source: "GDELT", title: "No elevated energy-conflict chatter", detail: "Event tone neutral across monitored corridors.", severity: "low", confidence: 0.8 }),
  ];
}

function scaleSeverity(base: Severity, intensity: number): Severity {
  if (intensity >= 70) return base === "elevated" ? "high" : base === "high" ? "critical" : base;
  if (intensity <= 30) return base === "critical" ? "high" : base === "high" ? "elevated" : base;
  return base;
}

/** Signals the sensing layer surfaces for a given disruption scenario. */
export function scenarioSignals(s: Scenario): RiskSignal[] {
  const i = s.intensity;
  const conf = (b: number) => clamp(b + (i - 50) / 250, 0.4, 0.97);

  if (s.kind === "hormuz" || s.kind === "custom") {
    return [
      sig({ source: "GDELT", title: "Naval escalation near Strait of Hormuz", detail: "Spike in conflict-tone events; shipping advisories issued by maritime authorities.", severity: scaleSeverity("high", i), confidence: conf(0.82), chokepointId: "hormuz" }),
      sig({ source: "AIS", title: "VLCCs loitering / AIS gaps at Hormuz approaches", detail: `${Math.max(2, Math.round(i / 18))} laden tankers slowed or went dark near the strait.`, severity: scaleSeverity("high", i), confidence: conf(0.76), chokepointId: "hormuz" }),
      sig({ source: "MARKET", title: "Brent jumps intraday; backwardation steepens", detail: "Futures pricing a war premium; prompt spreads widen.", severity: scaleSeverity("elevated", i), confidence: conf(0.9) }),
      sig({ source: "SANCTIONS", title: "Operator flagged on OFAC SDN watch", detail: "A tanker manager on an at-risk corridor matches a sanctions watch entry.", severity: scaleSeverity("elevated", i), confidence: conf(0.62), corridorId: "iraq-mumbai" }),
    ];
  }
  if (s.kind === "redsea") {
    return [
      sig({ source: "GDELT", title: "Red Sea shipping suspension widens", detail: "Carriers reroute via Cape; Bab-el-Mandeb transits curtailed.", severity: scaleSeverity("high", i), confidence: conf(0.8), chokepointId: "bab" }),
      sig({ source: "AIS", title: "Tanker diversions south of Suez", detail: "Russian/Med barrels rerouting around the Cape of Good Hope.", severity: scaleSeverity("high", i), confidence: conf(0.78), corridorId: "russia-vadinar" }),
      sig({ source: "MARKET", title: "Freight rates surge on longer hauls", detail: "Suezmax/Aframax TCE up sharply on diverted tonnage.", severity: scaleSeverity("elevated", i), confidence: conf(0.85) }),
    ];
  }
  // opec
  return [
    sig({ source: "GDELT", title: "OPEC+ signals emergency output cut", detail: "Coordinated cut messaging tightens the global slate.", severity: scaleSeverity("high", i), confidence: conf(0.79) }),
    sig({ source: "MARKET", title: "Sour-light spread widens", detail: "Medium-sour grades richen as supply tightens.", severity: scaleSeverity("elevated", i), confidence: conf(0.84) }),
    sig({ source: "AIS", title: "Loading slowdowns at Gulf terminals", detail: "Nomination cadence eases at key export ports.", severity: scaleSeverity("elevated", i), confidence: conf(0.7), chokepointId: "hormuz" }),
  ];
}

/** Corridors disrupted by a scenario (for map recolouring + reroute logic). */
export function disruptedChokepoints(s: Scenario): string[] {
  if (s.kind === "hormuz" || s.kind === "custom") return ["hormuz"];
  if (s.kind === "redsea") return ["bab"];
  return [];
}
