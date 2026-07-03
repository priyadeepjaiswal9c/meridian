"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, ChevronDown, Sigma } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { Dock } from "@/components/ui/Dock";
import { brentTrend, sevText } from "@/components/ui/primitives";
import { cn, fmtInrCrore, fmtPct } from "@/lib/utils";

/** Bespoke SVG area chart — Brent ramping from baseline to the shocked price. */
function ShockRamp({ base, shocked }: { base: number; shocked: number }) {
  const data = brentTrend(base, shocked);
  const min = Math.min(...data) * 0.995;
  const max = Math.max(...data) * 1.005;
  const W = 320;
  const H = 68;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min || 1)) * (H - 12) - 4;
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <defs>
        <linearGradient id="rampStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="55%" stopColor="var(--color-data)" />
          <stop offset="100%" stopColor="var(--color-alert)" />
        </linearGradient>
        <linearGradient id="rampFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-alert)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--color-alert)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={y(base)} y2={y(base)} stroke="#d9dbdf" strokeDasharray="3 4" />
      <path d={`${line}L${W},${H}L0,${H}Z`} fill="url(#rampFill)" />
      <path d={line} fill="none" stroke="url(#rampStroke)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={W - 1.5} cy={y(shocked)} r="2.6" fill="var(--color-alert)" />
    </svg>
  );
}

/** Reserve cover depleting across the shock window as the SPR plugs the gap. */
function SprStrip({ from, to }: { from: number; to: number }) {
  const N = 16;
  return (
    <div className="flex h-9 items-end gap-[3px]">
      {Array.from({ length: N }, (_, i) => {
        const v = from + (to - from) * (i / (N - 1));
        const cls = v > from * 0.88 ? "bg-data/50" : v > from * 0.74 ? "bg-warn/60" : "bg-alert/65";
        return (
          <div
            key={i}
            className={cn("flex-1 rounded-[2px]", cls)}
            style={{ height: `${(v / from) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

export function CascadePanel() {
  const { cascade } = useMeridian();
  const [showAssumptions, setShowAssumptions] = useState(false);

  if (!cascade) {
    return (
      <Dock eyebrow="Cascade impact" title="Downstream economic model">
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Activity size={20} className="text-text-faint" />
          <p className="max-w-[240px] text-[12.5px] leading-relaxed text-text-faint">
            Fire a scenario to model how a shock propagates from crude price to GDP — every number is auditable.
          </p>
        </div>
      </Dock>
    );
  }

  return (
    <Dock
      eyebrow="Cascade impact"
      title="Shock → price → refinery → GDP"
      right={
        <span className="num text-[11px] text-text-faint">{cascade.scenario.intensity}% shock</span>
      }
    >
      <div className="p-4">
        <div className="relative space-y-2.5">
          <div className="absolute bottom-3 left-[9px] top-3 w-px bg-hairline-strong" />
          {cascade.steps.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3, ease: [0.2, 0, 0.38, 0.9] }}
              className="relative flex items-center gap-3 pl-7"
            >
              <span
                className={cn(
                  "num absolute left-0 top-1/2 flex size-[19px] -translate-y-1/2 items-center justify-center rounded-full border bg-surface-1 text-[9.5px] font-semibold",
                  sevText[s.tone],
                  "border-current/30",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-text">{s.label}</div>
                <div className="truncate text-[11px] text-text-faint">{s.detail}</div>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("num text-[13px] font-semibold", sevText[s.tone])}>{s.value}</span>
                {typeof s.deltaPct === "number" && Math.abs(s.deltaPct) >= 0.05 && (
                  <span className={cn("num text-[10px]", sevText[s.tone])}>{fmtPct(s.deltaPct)}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-4 flex items-end justify-between rounded-[8px] border border-alert/25 bg-alert-soft px-3.5 py-3"
        >
          <div>
            <div className="eyebrow text-alert/80">Modelled 30-day national cost</div>
            <div className="mt-0.5 text-[10.5px] text-text-faint">Extra crude import bill, sustained shock</div>
          </div>
          <div className="num font-display text-[24px] font-semibold text-alert">{fmtInrCrore(cascade.econCostCrore)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-3 grid gap-2.5"
        >
          <div className="rounded-[8px] border border-hairline bg-surface-1 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="eyebrow">Brent · 30-day shock ramp</span>
              <span className="num text-[11px]">
                <span className="text-text-faint">${cascade.brentBaseline.toFixed(0)}</span>
                <span className="text-text-faint"> → </span>
                <span className="font-semibold text-alert">${cascade.brentShocked.toFixed(0)}</span>
              </span>
            </div>
            <ShockRamp base={cascade.brentBaseline} shocked={cascade.brentShocked} />
          </div>
          <div className="rounded-[8px] border border-hairline bg-surface-1 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="eyebrow">Strategic reserve optimiser</span>
              <span className="num text-[11px] text-warn">
                {cascade.reserveDaysBaseline.toFixed(1)}d → {cascade.reserveDaysAfter.toFixed(1)}d
                <span className="text-text-faint">
                  {" "}
                  · draw ≈ {(cascade.supplyAtRiskBpd / 1000).toFixed(0)} kb/d
                </span>
              </span>
            </div>
            <SprStrip from={cascade.reserveDaysBaseline} to={cascade.reserveDaysAfter} />
            <div className="mt-1.5 text-[10.5px] leading-snug text-text-faint">
              SPR drawdown schedule to plug the uncovered import gap across the 30-day window.
            </div>
          </div>
        </motion.div>

        <button
          onClick={() => setShowAssumptions((v) => !v)}
          className="mt-3 flex w-full items-center justify-between text-text-faint hover:text-text-dim"
        >
          <span className="eyebrow flex items-center gap-1.5">
            <Sigma size={11} /> Model assumptions
          </span>
          <ChevronDown size={13} className={cn("transition-transform", showAssumptions && "rotate-180")} />
        </button>
        {showAssumptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 overflow-hidden border-t border-hairline pt-2.5"
          >
            {cascade.assumptions.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] text-text-faint">{a.label}</span>
                <span className="num text-[10.5px] text-text-dim">{a.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </Dock>
  );
}
