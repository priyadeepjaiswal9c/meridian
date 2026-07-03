"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Globe, Radar, ShieldAlert, TrendingUp } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { chokepointById } from "@/lib/geo/india";
import { Dock } from "@/components/ui/Dock";
import { Pill } from "@/components/ui/primitives";
import { cn, fmtClock } from "@/lib/utils";
import type { RiskSignal } from "@/lib/types";

const SOURCE: Record<RiskSignal["source"], { icon: typeof Globe; label: string; cls: string }> = {
  GDELT: { icon: Globe, label: "Geopolitical", cls: "text-data" },
  AIS: { icon: Radar, label: "Maritime", cls: "text-signal" },
  MARKET: { icon: TrendingUp, label: "Market", cls: "text-ok" },
  SANCTIONS: { icon: ShieldAlert, label: "Sanctions", cls: "text-alert" },
};

export function RiskFeed() {
  const { signals } = useMeridian();

  const focusSignal = (s: RiskSignal) => {
    const cp = s.chokepointId ? chokepointById(s.chokepointId) : undefined;
    if (!cp) return;
    useMeridian.setState({
      cameraCue: { id: Date.now(), kind: "focus", target: [cp.lng, cp.lat] },
    });
  };

  return (
    <Dock
      eyebrow="Signal feed"
      title="Live risk sensing"
      grow
      right={
        <span className="num rounded-full border border-hairline px-2 py-0.5 text-[11px] text-text-dim">
          {signals.length}
        </span>
      }
      bodyClassName="min-h-0 flex-1 space-y-2 overflow-y-auto p-3"
    >
      <AnimatePresence initial={false}>
        {signals.map((s) => {
          const meta = SOURCE[s.source];
          const Icon = meta.icon;
          const focusable = !!(s.chokepointId && chokepointById(s.chokepointId));
          return (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0.38, 0.9] }}
              onClick={() => focusSignal(s)}
              title={focusable ? "Fly the map to this location" : undefined}
              className={cn(
                "group rounded-[8px] border border-hairline bg-surface-1 p-3 transition-colors hover:bg-surface-2",
                focusable && "cursor-pointer",
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className={cn("flex items-center gap-1.5", meta.cls)}>
                  <Icon size={13} strokeWidth={1.8} />
                  <span className="text-[11px] font-medium">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {focusable && (
                    <Crosshair
                      size={12}
                      className="text-text-faint opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  )}
                  <span className="num text-[10.5px] text-text-faint">{Math.round(s.confidence * 100)}%</span>
                  <Pill severity={s.severity}>{s.severity}</Pill>
                </div>
              </div>
              <div className="text-[13px] font-semibold leading-snug text-text">{s.title}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-text-dim">{s.detail}</div>
              <div className="num mt-1.5 font-mono text-[10px] text-text-faint">{fmtClock(s.ts)} UTC</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Dock>
  );
}
