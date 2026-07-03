"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { Anchor, Flame, Play, RotateCcw, Ship } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { SCENARIO_PRESETS } from "@/lib/sim/cascade";
import { Dock } from "@/components/ui/Dock";
import { cn } from "@/lib/utils";
import type { ScenarioKind } from "@/lib/types";

const OPTIONS: { kind: Exclude<ScenarioKind, "baseline" | "custom">; label: string; icon: typeof Ship }[] = [
  { kind: "hormuz", label: "Hormuz", icon: Anchor },
  { kind: "redsea", label: "Red Sea", icon: Ship },
  { kind: "opec", label: "OPEC+ cut", icon: Flame },
];

export function ScenarioConsole() {
  const { intensity, setIntensity, run, reset, running, hasRun } = useMeridian();
  const [kind, setKind] = useState<Exclude<ScenarioKind, "baseline" | "custom">>("hormuz");

  return (
    <Dock eyebrow="Scenario console" title="Stress-test the supply network">
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            const active = kind === o.kind;
            return (
              <button
                key={o.kind}
                onClick={() => setKind(o.kind)}
                disabled={running}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[8px] border px-2 py-3",
                  active
                    ? "border-signal bg-signal-soft text-signal"
                    : "border-hairline bg-surface-1 text-text-dim hover:border-hairline-strong hover:text-text",
                )}
              >
                <Icon size={17} strokeWidth={1.7} />
                <span className="text-[12px] font-medium">{o.label}</span>
              </button>
            );
          })}
        </div>

        <p className="min-h-[34px] text-[12.5px] leading-relaxed text-text-dim">
          {SCENARIO_PRESETS[kind].description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Shock intensity</span>
            <span className="num text-[13px] font-semibold text-text">{intensity}%</span>
          </div>
          <Slider.Root
            value={[intensity]}
            onValueChange={([v]) => setIntensity(v)}
            min={0}
            max={100}
            step={5}
            disabled={running}
            className="relative flex h-5 w-full touch-none items-center select-none"
          >
            <Slider.Track className="relative h-[3px] grow overflow-hidden rounded-full bg-surface-3">
              <Slider.Range className="absolute h-full rounded-full bg-signal" />
            </Slider.Track>
            <Slider.Thumb
              className="block size-4 rounded-full border border-hairline-strong bg-surface-1 shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              aria-label="Shock intensity"
            />
          </Slider.Root>
          <div className="flex justify-between text-[10.5px] text-text-faint">
            <span>Contained</span>
            <span>Partial</span>
            <span>Severe</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => run(kind, intensity)}
            disabled={running}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[7px] px-3 py-2.5 text-[13px] font-semibold",
              "bg-alert text-white hover:bg-[#96282c] disabled:opacity-40",
            )}
          >
            <Play size={13} fill="currentColor" className={cn(running && "animate-pulse")} />
            {running ? "Simulating…" : "Simulate crisis"}
          </button>
          <button
            onClick={reset}
            disabled={running || !hasRun}
            className="flex items-center justify-center rounded-[7px] border border-hairline bg-surface-1 px-3 text-text-dim hover:border-hairline-strong hover:text-text disabled:opacity-30"
            aria-label="Reset"
            title="Reset to baseline"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </Dock>
  );
}
