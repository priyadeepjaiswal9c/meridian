"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, CheckCheck, ShieldCheck, Timer, X } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { Dock } from "@/components/ui/Dock";
import { cn, fmtUsd } from "@/lib/utils";
import type { Recommendation, VerifyState } from "@/lib/types";

function VerifyChip({ label, state }: { label: string; state: VerifyState }) {
  return (
    <div
      title={state.note}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        state.ok ? "border-ok/25 bg-ok/[0.06] text-ok" : "border-alert/30 bg-alert/[0.06] text-alert",
      )}
    >
      {state.ok ? <Check size={9} strokeWidth={3} /> : <X size={9} strokeWidth={3} />}
      {label}
    </div>
  );
}

function Card({ rec, i }: { rec: Recommendation; i: number }) {
  const { selectRec, approve, approvedIds } = useMeridian();
  const approved = approvedIds.includes(rec.id);
  const best = rec.rank === 1;
  const premiumNeg = rec.premiumUsdBbl < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08, duration: 0.3, ease: [0.2, 0, 0.38, 0.9] }}
      onMouseEnter={() => selectRec(rec.corridorId)}
      onMouseLeave={() => selectRec(null)}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2.5 rounded-[9px] border p-3.5 transition-colors",
        approved
          ? "border-ok/45 bg-ok/[0.06]"
          : best
            ? "border-signal/45 bg-signal-soft"
            : "border-hairline bg-surface-1 hover:border-hairline-strong hover:bg-surface-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "num flex size-5 items-center justify-center rounded-full text-[10.5px] font-semibold",
              best ? "bg-signal text-white dark:text-ink" : "border border-hairline-strong text-text-dim",
            )}
          >
            {rec.rank}
          </span>
          <span className="text-[12.5px] font-semibold leading-tight text-text">{rec.routeName}</span>
        </div>
        <div className="flex items-center gap-1 text-ok">
          <ShieldCheck size={12} />
          <span className="num text-[11.5px] font-semibold">{Math.round(rec.confidence * 100)}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-y border-hairline py-2">
        <div>
          <div className="eyebrow text-[10.5px]">Prem.</div>
          <div className={cn("num whitespace-nowrap text-[12px] font-semibold", premiumNeg ? "text-ok" : "text-text")}>
            {premiumNeg ? "−" : "+"}
            {fmtUsd(Math.abs(rec.premiumUsdBbl))}
          </div>
        </div>
        <div>
          <div className="eyebrow text-[10.5px]">Lead</div>
          <div className="num whitespace-nowrap text-[12px] font-semibold text-text">{rec.leadTimeDays}d</div>
        </div>
        <div>
          <div className="eyebrow text-[10.5px]">Fit</div>
          <div className="num whitespace-nowrap text-[12px] font-semibold text-text">{Math.round(rec.gradeFit * 100)}%</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <VerifyChip label="Compliance" state={rec.verification.compliance} />
        <VerifyChip label="Logistics" state={rec.verification.logistics} />
        <VerifyChip label="Finance" state={rec.verification.finance} />
      </div>

      <button
        onClick={() => approve(rec.id)}
        disabled={approved}
        className={cn(
          "mt-auto flex items-center justify-center gap-1.5 rounded-[6px] px-2 py-2 text-[12px] font-medium",
          approved
            ? "cursor-default bg-ok/15 text-ok"
            : best
              ? "bg-text text-ink hover:opacity-90"
              : "border border-hairline text-text-dim hover:border-hairline-strong hover:text-text",
        )}
      >
        {approved ? (
          <>
            <CheckCheck size={13} /> Routed · {rec.volumeMbbl} mbbl committed
          </>
        ) : (
          <>
            Approve & route {rec.volumeMbbl} mbbl <ArrowRight size={12} />
          </>
        )}
      </button>
    </motion.div>
  );
}

export function RecommendationPanel() {
  const { recommendations, hasRun, runDurationMs } = useMeridian();
  if (!hasRun || recommendations.length === 0) return null;

  return (
    <Dock
      eyebrow="Adaptive procurement"
      title="Verified crude reroutes — ready to execute"
      right={
        <span className="flex items-center gap-2.5">
          {runDurationMs != null && (
            <span
              className="num flex items-center gap-1 rounded-full border border-signal/30 bg-signal-soft px-2 py-0.5 text-[10.5px] font-semibold text-signal"
              title="End-to-end response time — first signal to verified, executable plan"
            >
              <Timer size={10.5} strokeWidth={2.4} />
              signal → plan {(runDurationMs / 1000).toFixed(1)}s
            </span>
          )}
          <span className="num text-[11px] font-medium text-ok">{recommendations.length} cleared</span>
        </span>
      }
    >
      <div className="flex gap-2.5 p-3">
        {recommendations.map((r, i) => (
          <Card key={r.id} rec={r} i={i} />
        ))}
      </div>
    </Dock>
  );
}
