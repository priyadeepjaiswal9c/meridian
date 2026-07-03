"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Anchor,
  BookOpen,
  Flame,
  Home,
  Moon,
  PanelRightClose,
  RotateCcw,
  Ship,
  Sun,
  Waves,
} from "lucide-react";
import { useMeridian } from "@/lib/store";

export function CommandPalette() {
  const {
    paletteOpen,
    setPaletteOpen,
    run,
    reset,
    running,
    hasRun,
    intensity,
    theme,
    toggleTheme,
    toggleFocusMode,
  } = useMeridian();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!useMeridian.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  const act = (fn: () => void) => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <Command.Dialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      label="Command palette"
      overlayClassName="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[18vh] z-[100] w-[560px] max-w-[92vw] -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface-1 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.25)]">
        <Command.Input
          placeholder="Type a command…"
          className="w-full border-b border-hairline bg-transparent px-4 py-3.5 text-[14px] text-text outline-none placeholder:text-text-faint"
        />
        <Command.List className="max-h-[320px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-text-faint">
            No matching commands.
          </Command.Empty>

          <Command.Group
            heading="Simulate"
            className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            {[
              { icon: Anchor, label: "Simulate Hormuz closure", kind: "hormuz" as const },
              { icon: Ship, label: "Simulate Red Sea suspension", kind: "redsea" as const },
              { icon: Flame, label: "Simulate OPEC+ emergency cut", kind: "opec" as const },
            ].map((c) => (
              <Command.Item
                key={c.kind}
                disabled={running}
                onSelect={() => act(() => run(c.kind, intensity))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal data-[disabled=true]:opacity-40"
              >
                <c.icon size={15} strokeWidth={1.8} />
                {c.label}
              </Command.Item>
            ))}
            <Command.Item
              disabled={running || !hasRun}
              onSelect={() => act(reset)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal data-[disabled=true]:opacity-40"
            >
              <RotateCcw size={15} strokeWidth={1.8} />
              Reset to baseline
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="View"
            className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Command.Item
              onSelect={() => act(toggleTheme)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal"
            >
              {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
              {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </Command.Item>
            <Command.Item
              onSelect={() => act(toggleFocusMode)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal"
            >
              <PanelRightClose size={15} strokeWidth={1.8} />
              Toggle focus mode (pure map)
              <kbd className="ml-auto rounded border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-faint">
                F
              </kbd>
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="Navigate"
            className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Command.Item
              onSelect={() => act(() => router.push("/"))}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal"
            >
              <Home size={15} strokeWidth={1.8} />
              Back to the story
            </Command.Item>
            <Command.Item
              onSelect={() => act(() => window.open("/pitch.html", "_blank"))}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal"
            >
              <BookOpen size={15} strokeWidth={1.8} />
              Open the pitch deck
            </Command.Item>
            <Command.Item
              onSelect={() => act(() => window.open("https://ppac.gov.in", "_blank"))}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-text data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal"
            >
              <Waves size={15} strokeWidth={1.8} />
              PPAC data source
            </Command.Item>
          </Command.Group>
        </Command.List>
        <div className="flex items-center justify-between border-t border-hairline bg-surface-2 px-3.5 py-2">
          <span className="text-[11px] text-text-faint">Meridian command palette</span>
          <span className="flex items-center gap-1 text-[11px] text-text-faint">
            <kbd className="rounded border border-hairline bg-surface-1 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            run ·
            <kbd className="rounded border border-hairline bg-surface-1 px-1.5 py-0.5 font-mono text-[10px]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
