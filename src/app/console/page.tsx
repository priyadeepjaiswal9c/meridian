"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command as CommandIcon, Radio } from "lucide-react";
import { Toaster } from "sonner";
import { useMeridian } from "@/lib/store";
import { TopBar } from "@/components/shell/TopBar";
import { RiskFeed } from "@/components/panels/RiskFeed";
import { AgentTrace } from "@/components/panels/AgentTrace";
import { ScenarioConsole } from "@/components/panels/ScenarioConsole";
import { CascadePanel } from "@/components/panels/CascadePanel";
import { RecommendationPanel } from "@/components/panels/RecommendationPanel";
import { CommandPalette } from "@/components/console/CommandPalette";
import { MapControls } from "@/components/console/MapControls";
import { Legend } from "@/components/shell/Legend";
import { ResponsiveGuard } from "@/components/shell/ResponsiveGuard";
import { sevDot, sevText } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ConsoleMap = dynamic(() => import("@/components/map/ConsoleMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-3">
        <div className="size-7 animate-spin rounded-full border-2 border-hairline border-t-signal" />
        <div className="eyebrow animate-pulse">Preparing the digital twin…</div>
      </div>
    </div>
  ),
});

function Headline() {
  const { headline, severity, running, setPaletteOpen } = useMeridian();
  return (
    <div className="panel pointer-events-auto flex items-center gap-3 px-3.5 py-2.5">
      <Radio size={15} className={cn(sevText[severity], running && "animate-pulse")} />
      <span className={cn("size-2 shrink-0 rounded-full", sevDot[severity])} />
      <AnimatePresence mode="wait">
        <motion.span
          key={headline}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
          className="min-w-0 flex-1 truncate text-[13px] font-medium text-text"
        >
          {headline}
        </motion.span>
      </AnimatePresence>
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-hairline bg-surface-1 px-2 py-1 text-[11px] text-text-faint hover:border-hairline-strong hover:text-text-dim"
        title="Open command palette"
      >
        <CommandIcon size={11} />
        <span className="font-mono">⌘K</span>
      </button>
    </div>
  );
}

function DirectingChip() {
  const { directing } = useMeridian();
  return (
    <AnimatePresence>
      {directing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="pointer-events-none absolute left-1/2 top-16 z-30 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-signal/30 bg-surface-1/95 px-3.5 py-1.5 shadow-[0_4px_16px_rgba(15,98,254,0.15)]">
            <span className="size-1.5 animate-pulse rounded-full bg-signal" />
            <span className="text-[12px] font-medium text-signal">Meridian is driving — analysing the shock</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Console() {
  const panelsHidden = useMeridian((s) => s.panelsHidden);

  useEffect(() => {
    // F toggles focus mode (pure map)
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
        useMeridian.getState().toggleFocusMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const s = useMeridian.getState();
    s.init();
    s.hydrateLive();
    // Shareable auto-run for recorded demos: /console?run=hormuz&i=70
    const p = new URLSearchParams(window.location.search);
    const run = p.get("run");
    if (run && ["hormuz", "redsea", "opec"].includes(run)) {
      const intensity = Number(p.get("i")) || 60;
      const t = setTimeout(
        () => useMeridian.getState().run(run as "hormuz" | "redsea" | "opec", intensity),
        2800,
      );
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-ink text-text">
      <div className="absolute inset-0 z-0">
        <ConsoleMap />
      </div>

      {/* pointer-events-none so trackpad pan/pinch/scroll reach the map; each
          panel/control re-enables events on itself */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <TopBar />
        <DirectingChip />

        <div className="pointer-events-none relative flex-1">
          <AnimatePresence>
            {!panelsHidden && (
              <motion.div
                key="left-rail"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="pointer-events-none absolute bottom-3 left-3 top-3 flex w-[330px] flex-col gap-3"
              >
                <RiskFeed />
                <AgentTrace />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!panelsHidden && (
              <motion.div
                key="right-rail"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="pointer-events-none absolute bottom-3 right-3 top-3 flex w-[372px] flex-col gap-3 overflow-y-auto pr-0.5"
              >
                <ScenarioConsole />
                <CascadePanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map legend */}
          {!panelsHidden && (
            <div className="pointer-events-none absolute left-1/2 top-3 hidden -translate-x-1/2 xl:block">
              <Legend />
            </div>
          )}

          <MapControls />

          {/* Bottom-centre: reroutes + headline */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-3 flex flex-col gap-2.5 transition-[left,right] duration-300",
              panelsHidden ? "left-3 right-16" : "left-[350px] right-[392px]",
            )}
          >
            {!panelsHidden && <RecommendationPanel />}
            <Headline />
          </div>
        </div>
      </div>

      <CommandPalette />
      <Toaster
        position="bottom-right"
        offset={16}
        toastOptions={{
          style: {
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-hairline)",
            color: "var(--color-text)",
            fontSize: "13px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          },
        }}
      />
      <ResponsiveGuard />
    </main>
  );
}
