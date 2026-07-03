"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { geminiSynthesize } from "@/lib/llm";
import type {
  AgentEvent,
  AgentPhase,
  CascadeResult,
  LiveVessel,
  Recommendation,
  RiskSignal,
  Scenario,
  ScenarioKind,
  Severity,
} from "@/lib/types";
import { NATIONAL } from "@/lib/geo/india";
import { makeScenario } from "@/lib/sim/cascade";
import { buildResult, planAgentTimeline } from "@/lib/sim/orchestrate";
import { baselineSignals, disruptedChokepoints } from "@/lib/data/seed";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let cueSeq = 0;

/** Where the camera should focus per scenario (the shock's epicentre). */
const FOCUS: Record<string, [number, number]> = {
  hormuz: [56.25, 26.57],
  custom: [56.25, 26.57],
  redsea: [43.33, 12.58],
  opec: [50.5, 27.2], // Gulf loading terminals
};

interface MeridianStore {
  scenario: Scenario;
  intensity: number;
  running: boolean;
  phase: AgentPhase | null;
  hasRun: boolean;
  riskIndex: number;
  severity: Severity;
  signals: RiskSignal[];
  cascade: CascadeResult | null;
  recommendations: Recommendation[];
  agentEvents: AgentEvent[];
  headline: string;
  brent: number;
  disrupted: string[];
  selectedRec: string | null;
  liveData: boolean; // true once a real connector responds
  sanctions: { entities: number; vessels: number } | null;
  liveNews: RiskSignal[]; // cached live GDELT signals, survive runs/resets
  liveVessels: LiveVessel[]; // real AIS positions (burst-sampled)
  aiEnabled: boolean; // true when a Gemini key is connected (opt-in, client-side)
  geminiKey: string | null;
  runDurationMs: number | null; // signal → verified plan elapsed time

  // ── Director: drives camera + one-shot effects during a run ──────────────
  directing: boolean; // true while the app "takes the wheel"
  cameraCue: { id: number; kind: "establish" | "focus" | "reveal"; target?: [number, number] } | null;
  ripple: { id: number; lng: number; lat: number; startedAt: number } | null;
  paletteOpen: boolean;

  // ── Experience state ──────────────────────────────────────────────────────
  theme: "light" | "dark";
  panelsHidden: boolean; // focus mode — pure map
  approvedIds: string[]; // reroutes the operator has committed
  mapApi: {
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
    togglePitch: () => void;
  } | null;

  init: () => void;
  hydrateLive: () => Promise<void>;
  setPaletteOpen: (b: boolean) => void;
  setGeminiKey: (k: string | null) => void;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  toggleFocusMode: () => void;
  approve: (recId: string) => void;
  setMapApi: (api: MeridianStore["mapApi"]) => void;
  setIntensity: (n: number) => void;
  setBrent: (n: number) => void;
  setLiveData: (b: boolean) => void;
  run: (kind: ScenarioKind, intensity?: number) => Promise<void>;
  reset: () => void;
  selectRec: (id: string | null) => void;
}

export const useMeridian = create<MeridianStore>((set, get) => ({
  scenario: makeScenario("baseline", 0),
  intensity: 50,
  running: false,
  phase: null,
  hasRun: false,
  riskIndex: 12,
  severity: "low",
  signals: [],
  cascade: null,
  recommendations: [],
  agentEvents: [],
  headline: "All corridors nominal — national energy risk LOW.",
  brent: NATIONAL.brentBaselineUsd,
  disrupted: [],
  selectedRec: null,
  liveData: false,
  sanctions: null,
  liveNews: [],
  liveVessels: [],
  aiEnabled: false,
  geminiKey: null,
  runDurationMs: null,
  directing: false,
  cameraCue: null,
  ripple: null,
  paletteOpen: false,
  theme: "light",
  panelsHidden: false,
  approvedIds: [],
  mapApi: null,

  setPaletteOpen: (b) => set({ paletteOpen: b }),

  setGeminiKey: (k) => {
    try {
      if (k) localStorage.setItem("meridian-gemini-key", k);
      else localStorage.removeItem("meridian-gemini-key");
    } catch {}
    set({ geminiKey: k, aiEnabled: !!k });
  },

  setTheme: (t) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", t === "dark");
      try {
        localStorage.setItem("meridian-theme", t);
      } catch {}
    }
    set({ theme: t });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

  toggleFocusMode: () => set((s) => ({ panelsHidden: !s.panelsHidden })),

  setMapApi: (api) => set({ mapApi: api }),

  approve: (recId) => {
    if (get().approvedIds.includes(recId)) return;
    const rec = get().recommendations.find((r) => r.id === recId);
    set((s) => ({
      approvedIds: [...s.approvedIds, recId],
      // committing supply measurably de-risks the picture
      riskIndex: Math.max(14, s.riskIndex - 5),
      headline: rec
        ? `Cargo committed — ${rec.volumeMbbl} mbbl via ${rec.routeName}. National exposure falling.`
        : s.headline,
    }));
    const left = get().recommendations.length - get().approvedIds.length;
    toast.success(rec ? `Routed ${rec.volumeMbbl} mbbl — ${rec.routeName}` : "Cargo routed", {
      description:
        left > 0
          ? `Charter + compliance pack issued. ${left} reroute${left > 1 ? "s" : ""} still staged.`
          : "All staged reroutes committed. Risk index easing.",
    });
  },

  init: () => {
    // sync theme with the class the FOUC-guard script already applied
    if (typeof document !== "undefined") {
      set({ theme: document.documentElement.classList.contains("dark") ? "dark" : "light" });
      try {
        const k = localStorage.getItem("meridian-gemini-key") || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (k) set({ geminiKey: k, aiEnabled: true });
      } catch {}
    }
    if (get().signals.length) return;
    set({ signals: baselineSignals() });
  },

  hydrateLive: () => {
    const atBaseline = () => get().scenario.kind === "baseline";

    // Each source updates the store independently so a slow one never blocks the rest.
    fetch("/api/data/prices")
      .then((r) => r.json())
      .then((p) => {
        if (p?.brent) set({ brent: p.brent });
        if (p?.source === "live") set({ liveData: true });
      })
      .catch(() => {});

    fetch("/api/data/news")
      .then((r) => r.json())
      .then((n) => {
        if (n?.source !== "live") return;
        set({ liveData: true });
        const sig: RiskSignal[] = Array.isArray(n.signals) ? n.signals : [];
        if (!sig.length) return;
        set({ liveNews: sig });
        if (atBaseline()) set({ signals: [...sig, ...baselineSignals()].slice(0, 10) });
      })
      .catch(() => {});

    fetch("/api/data/vessels")
      .then((r) => r.json())
      .then((v) => {
        if (v?.source !== "live" || !Array.isArray(v.vessels)) return;
        set({ liveVessels: v.vessels, liveData: true });
      })
      .catch(() => {});

    fetch("/api/data/sanctions")
      .then((r) => r.json())
      .then((s) => {
        if (s) set({ sanctions: { entities: s.entities, vessels: s.vessels } });
        if (s?.source !== "live") return;
        set({ liveData: true });
        if (!atBaseline()) return;
        const ofac: RiskSignal = {
          id: "ofac-live",
          ts: Date.now(),
          source: "SANCTIONS",
          title: `OFAC SDN registry synced — ${Number(s.vessels).toLocaleString()} sanctioned vessels`,
          detail: `${Number(s.entities).toLocaleString()} entities screened against active corridors.`,
          severity: "low",
          confidence: 0.95,
        };
        set((st) => ({
          signals: [ofac, ...st.signals.filter((x) => x.id !== "ofac-live")].slice(0, 10),
        }));
      })
      .catch(() => {});

    return Promise.resolve();
  },

  setIntensity: (n) => set({ intensity: n }),
  setBrent: (n) => set({ brent: n }),
  setLiveData: (b) => set({ liveData: b }),
  selectRec: (id) => set({ selectedRec: id }),

  reset: () => {
    const scenario = makeScenario("baseline", 0);
    set({
      scenario,
      running: false,
      phase: null,
      hasRun: false,
      riskIndex: 12,
      severity: "low",
      // keep live GDELT headlines through resets — don't downgrade to seeded
      signals: [...get().liveNews, ...baselineSignals()].slice(0, 10),
      cascade: null,
      recommendations: [],
      agentEvents: [],
      headline: "All corridors nominal — national energy risk LOW.",
      disrupted: [],
      selectedRec: null,
      runDurationMs: null,
      directing: false,
      ripple: null,
      approvedIds: [],
      cameraCue: { id: ++cueSeq, kind: "establish" },
    });
  },

  run: async (kind, intensity) => {
    if (get().running) return;
    const t0 = Date.now();
    const it = intensity ?? get().intensity;
    const scenario = makeScenario(kind, it);
    const disrupted = disruptedChokepoints(scenario);

    const focus = kind !== "baseline" ? FOCUS[kind] : undefined;
    set({
      scenario,
      running: true,
      phase: "sense",
      agentEvents: [],
      recommendations: [],
      cascade: null,
      hasRun: false,
      disrupted,
      selectedRec: null,
      approvedIds: [],
      directing: kind !== "baseline",
      cameraCue: focus ? { id: ++cueSeq, kind: "focus", target: focus } : null,
    });

    const timeline = planAgentTimeline(scenario);
    let rippleFired = false;
    let revealFired = false;
    for (const e of timeline) {
      set((s) => ({ agentEvents: [...s.agentEvents, e], phase: e.phase }));
      // Director beats: crisis ripple on the first alert; camera pull-back at ACT
      if (!rippleFired && e.status === "alert" && focus) {
        set({ ripple: { id: ++cueSeq, lng: focus[0], lat: focus[1], startedAt: Date.now() } });
        rippleFired = true;
      }
      if (!revealFired && e.phase === "act") {
        set({ cameraCue: { id: ++cueSeq, kind: "reveal" } });
        revealFired = true;
      }
      if (e.agent === "Compliance" && e.status === "alert") {
        toast.warning("Compliance rejected a candidate", { description: e.message });
      }
      await sleep(e.status === "thinking" ? 200 : 460);
    }

    const result = buildResult(scenario, get().brent);
    // weave real live headlines (if any) into the scenario's signal picture
    const liveTop = get().liveNews.slice(0, 2);
    set({
      signals: [...result.signals.slice(0, 8), ...liveTop].slice(0, 11),
      cascade: result.cascade,
      recommendations: result.recommendations,
      headline: result.headline,
      riskIndex: result.riskIndex,
      severity: result.severity,
      running: false,
      phase: null,
      hasRun: kind !== "baseline",
      runDurationMs: Date.now() - t0,
      directing: false,
    });

    if (kind !== "baseline" && result.recommendations.length) {
      toast.success(`${result.recommendations.length} verified reroutes staged`, {
        description: `Signal → executable plan in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
      });
    }

    // Opt-in Gemini synthesis (client-side) — enriches headline + trace when a key is connected.
    const geminiKey = get().geminiKey;
    if (geminiKey && kind !== "baseline") {
      geminiSynthesize(
        {
          scenario: { kind: scenario.kind, label: scenario.label, intensity: scenario.intensity },
          cascade: {
            brentDeltaPct: result.cascade.brentDeltaPct,
            supplyAtRiskMbpd: result.cascade.supplyAtRiskBpd / 1e6,
            gdpDeltaPct: result.cascade.gdpDeltaPct,
            reserveDaysAfter: result.cascade.reserveDaysAfter,
          },
          topReroute: result.recommendations[0]?.routeName ?? null,
          signals: get().signals.slice(0, 5).map((s) => s.title),
        },
        geminiKey,
      ).then((brief) => {
        if (!brief) return;
        set((s) => ({
          headline: brief,
          agentEvents: [
            ...s.agentEvents,
            {
              id: `gemini-${Date.now()}`,
              ts: Date.now(),
              phase: "reason" as const,
              agent: "Gemini",
              status: "done" as const,
              message: "Live LLM synthesis of the risk picture.",
            },
          ],
        }));
      });
    }
  },
}));
