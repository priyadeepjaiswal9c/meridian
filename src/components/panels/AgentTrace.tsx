"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cpu, Loader2, TriangleAlert } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { Dock } from "@/components/ui/Dock";
import { cn } from "@/lib/utils";
import type { AgentPhase } from "@/lib/types";

const PHASE: Record<AgentPhase, { label: string; cls: string; bg: string }> = {
  sense: { label: "Sense", cls: "text-signal", bg: "bg-signal" },
  reason: { label: "Reason", cls: "text-data", bg: "bg-data" },
  act: { label: "Act", cls: "text-ok", bg: "bg-ok" },
  verify: { label: "Verify", cls: "text-warn", bg: "bg-warn" },
};
const ORDER: AgentPhase[] = ["sense", "reason", "act", "verify"];

export function AgentTrace() {
  const { agentEvents, phase, running } = useMeridian();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [agentEvents.length]);

  const activeIdx = phase ? ORDER.indexOf(phase) : -1;

  return (
    <Dock
      eyebrow="Agent mesh"
      title="Reasoning trace"
      right={<Cpu size={14} className={cn("text-text-faint", running && "animate-pulse text-signal")} />}
    >

      {/* phase stepper */}
      <div className="flex items-center gap-1.5 border-b border-hairline px-3.5 py-2">
        {ORDER.map((p, i) => {
          const done = activeIdx > i;
          const active = activeIdx === i;
          return (
            <div key={p} className="flex flex-1 items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  active || done ? PHASE[p].bg : "bg-hairline-strong",
                )}
              />
              <span
                className={cn(
                  "text-[10.5px] font-medium transition-colors",
                  active || done ? PHASE[p].cls : "text-text-faint",
                )}
              >
                {PHASE[p].label}
              </span>
              {i < ORDER.length - 1 && <span className="h-px flex-1 bg-hairline" />}
            </div>
          );
        })}
      </div>

      <div className="h-[152px] space-y-1.5 overflow-y-auto bg-surface-2/60 p-3 font-mono">
        {agentEvents.length === 0 && (
          <div className="flex h-full items-center justify-center text-center font-sans text-[12px] text-text-faint">
            Idle — trigger a scenario to engage the agent mesh.
          </div>
        )}
        <AnimatePresence initial={false}>
          {agentEvents.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16 }}
              className="flex items-start gap-2 text-[11.5px] leading-snug"
            >
              <span className={cn("mt-[2px] w-[42px] shrink-0 text-[10px] font-semibold", PHASE[e.phase].cls)}>
                {PHASE[e.phase].label}
              </span>
              <span className="mt-[1px] shrink-0">
                {e.status === "thinking" ? (
                  <Loader2 size={11} className="animate-spin text-text-faint" />
                ) : e.status === "alert" ? (
                  <TriangleAlert size={11} className="text-alert" />
                ) : (
                  <Check size={11} className="text-ok" />
                )}
              </span>
              <span className="min-w-0">
                <span className="font-semibold text-text">{e.agent}</span>{" "}
                <span className="text-text-dim">{e.message}</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </Dock>
  );
}
