"use client";

import { cn } from "@/lib/utils";

const ITEMS = [
  { c: "bg-data", label: "Corridor · Refinery" },
  { c: "bg-signal", label: "Tanker" },
  { c: "bg-warn", label: "Chokepoint" },
  { c: "bg-alert", label: "Disrupted" },
  { c: "bg-ok", label: "Reroute" },
];

export function Legend() {
  return (
    <div className="panel pointer-events-auto flex items-center gap-4 px-3.5 py-1.5">
      {ITEMS.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", i.c)} />
          <span className="whitespace-nowrap text-[11px] text-text-dim">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
