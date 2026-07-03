"use client";

import { Locate, Minus, Mountain, PanelRightClose, PanelRightOpen, Plus } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { cn } from "@/lib/utils";

function Ctl({
  onClick,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className="flex size-9 items-center justify-center text-text-dim first:rounded-t-[9px] last:rounded-b-[9px] hover:bg-surface-2 hover:text-text disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function MapControls() {
  const { mapApi, directing, panelsHidden, toggleFocusMode } = useMeridian();

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-[70px] right-3 z-20 flex flex-col divide-y divide-hairline overflow-hidden rounded-[9px] border border-hairline bg-surface-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        panelsHidden ? "right-3" : "right-[392px]",
      )}
    >
      <Ctl title="Zoom in" onClick={() => mapApi?.zoomIn()} disabled={!mapApi || directing}>
        <Plus size={15} />
      </Ctl>
      <Ctl title="Zoom out" onClick={() => mapApi?.zoomOut()} disabled={!mapApi || directing}>
        <Minus size={15} />
      </Ctl>
      <Ctl title="Reset view" onClick={() => mapApi?.reset()} disabled={!mapApi || directing}>
        <Locate size={14.5} />
      </Ctl>
      <Ctl title="Toggle 2D / 3D tilt" onClick={() => mapApi?.togglePitch()} disabled={!mapApi || directing}>
        <Mountain size={14.5} />
      </Ctl>
      <Ctl title={panelsHidden ? "Show panels" : "Focus mode — hide panels (F)"} onClick={toggleFocusMode}>
        {panelsHidden ? <PanelRightOpen size={14.5} /> : <PanelRightClose size={14.5} />}
      </Ctl>
    </div>
  );
}
