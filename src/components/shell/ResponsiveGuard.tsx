"use client";

import { MonitorUp } from "lucide-react";

// Meridian's console is laid out for wide screens. Below ~lg, show a graceful notice
// instead of a broken layout. (lg:hidden → this overlay is visible only under 1024px.)
export function ResponsiveGuard() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink p-8 text-center lg:hidden">
      <MonitorUp size={30} className="text-signal" />
      <div className="font-display text-[26px] font-semibold text-text">Meridian</div>
      <p className="max-w-sm text-[13.5px] leading-relaxed text-text-dim">
        Meridian is a full-screen intelligence console — a live map with analysis panels. Open it
        on a desktop or a wider window (≥ 1024px) for the real thing.
      </p>
      <div className="eyebrow">National energy resilience intelligence</div>
    </div>
  );
}
