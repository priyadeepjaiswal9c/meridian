"use client";

import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { useMeridian } from "@/lib/store";
import { NATIONAL } from "@/lib/geo/india";
import { Sparkline, brentTrend, sevDot, sevText } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ConnectAI } from "@/components/console/ConnectAI";
import { cn } from "@/lib/utils";

function MeridianGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 30 30" fill="none" className="shrink-0">
      <circle cx="15" cy="15" r="12.5" stroke="#171717" strokeWidth="1.2" />
      <ellipse cx="15" cy="15" rx="5" ry="12.5" stroke="#0f62fe" strokeWidth="1" />
      <line x1="2.5" y1="15" x2="27.5" y2="15" stroke="#0f62fe" strokeWidth="1" />
      <circle cx="15" cy="15" r="1.7" fill="#171717" />
    </svg>
  );
}

function Kpi({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-5">
      <div className="eyebrow whitespace-nowrap">{label}</div>
      <div className={cn("num text-[15px] font-semibold leading-tight", className)}>{children}</div>
    </div>
  );
}

export function TopBar() {
  const { brent, cascade, riskIndex, severity, running, liveData } = useMeridian();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const effectiveBrent = cascade ? cascade.brentShocked : brent;
  const reserve = cascade ? cascade.reserveDaysAfter : NATIONAL.reserveDays;

  const status = running
    ? { label: "Simulating", cls: "text-signal", dot: "bg-signal" }
    : liveData
      ? { label: "Live data", cls: "text-ok", dot: "bg-ok" }
      : { label: "Seeded", cls: "text-text-faint", dot: "bg-text-faint" };

  return (
    <header className="pointer-events-auto flex h-[62px] items-stretch justify-between gap-3 border-b border-hairline bg-surface-1 px-5">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <MeridianGlyph />
        <div className="leading-none">
          <div className="font-display text-[21px] font-semibold tracking-tight text-text">Meridian</div>
          <div className="mt-0.5 text-[10.5px] leading-none text-text-faint">
            National energy resilience intelligence
          </div>
        </div>
        <div className="ml-2 hidden items-center gap-1.5 rounded-full border border-hairline bg-surface-1 px-2.5 py-1 lg:inline-flex">
          <span className={cn("size-1.5 rounded-full", status.dot)} />
          <span className={cn("text-[11px] font-medium", status.cls)}>{status.label}</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex items-center">
        <div className="hidden items-center divide-x divide-hairline md:flex">
          <Kpi label="Import dependency" className="text-text">
            {NATIONAL.crudeImportDependencyPct}%
          </Kpi>
          <Kpi label="Via Hormuz" className="text-text">
            {NATIONAL.hormuzSharePct}%
          </Kpi>
          <Kpi label="Reserve cover" className={cascade ? "text-warn" : "text-text"}>
            <NumberFlow
              value={Number(reserve.toFixed(1))}
              suffix="d"
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </Kpi>
          <Kpi label="Brent" className={cascade ? "text-alert" : "text-text"}>
            <span className="flex items-center gap-2">
              <NumberFlow
                value={Number(effectiveBrent.toFixed(1))}
                prefix="$"
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
              <Sparkline
                data={brentTrend(brent, cascade?.brentShocked)}
                stroke={cascade ? "var(--color-alert)" : "var(--color-data)"}
              />
            </span>
          </Kpi>
        </div>

        {/* National risk index */}
        <div className="flex items-center gap-3.5 border-l border-hairline pl-5 pr-1">
          <div className="flex flex-col items-end gap-1">
            <div className="eyebrow">Risk index</div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium capitalize">
              <span className={cn("size-1.5 rounded-full", sevDot[severity])} />
              <span className={sevText[severity]}>{severity}</span>
            </div>
          </div>
          <div className={cn("num font-display text-[34px] font-semibold leading-none", sevText[severity])}>
            <NumberFlow value={Math.round(riskIndex)} />
          </div>
          <div className="hidden w-px self-stretch bg-hairline sm:block" />
          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <div className="eyebrow">UTC</div>
            <div className="num font-mono text-[12px] text-text-dim">{clock || "—"}</div>
          </div>
          <ConnectAI />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
