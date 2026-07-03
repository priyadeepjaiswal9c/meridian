"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Severity } from "@/lib/types";
import { cn, lerp } from "@/lib/utils";

// ── Severity → token ───────────────────────────────────────────────────────
export const sevText: Record<Severity, string> = {
  low: "text-text-faint",
  elevated: "text-signal",
  high: "text-warn",
  critical: "text-alert",
};
export const sevDot: Record<Severity, string> = {
  low: "bg-text-faint",
  elevated: "bg-signal",
  high: "bg-warn",
  critical: "bg-alert",
};
export const sevBorder: Record<Severity, string> = {
  low: "border-hairline",
  elevated: "border-signal/30",
  high: "border-warn/30",
  critical: "border-alert/35",
};

// ── Panel ──────────────────────────────────────────────────────────────────
export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>
        {title ? (
          <div className="truncate text-[13.5px] font-semibold text-text">{title}</div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

// ── Eyebrow ─────────────────────────────────────────────────────────────────
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

// ── Pill ─────────────────────────────────────────────────────────────────────
export function Pill({
  severity,
  children,
  className,
  pulse,
}: {
  severity: Severity;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  void pulse; // looping motion removed by design
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-surface-1 px-2 py-0.5 text-[11px] font-medium capitalize",
        sevText[severity],
        sevBorder[severity],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", sevDot[severity])} />
      {children}
    </span>
  );
}

// ── Thin bar ──────────────────────────────────────────────────────────────────
export function Bar({ value, className, tone = "bg-signal" }: { value: number; className?: string; tone?: string }) {
  return (
    <div className={cn("h-1 overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  variant = "ghost",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "signal" | "alert" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[7px] px-3.5 py-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40",
        variant === "ghost" && "border border-hairline bg-surface-1 text-text-dim hover:border-hairline-strong hover:text-text",
        variant === "signal" && "bg-text text-ink hover:opacity-90",
        variant === "alert" && "bg-alert text-white hover:bg-[#96282c]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Animated number ───────────────────────────────────────────────────────────
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.6,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.2, 0, 0.38, 0.9],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);
  return <span className={className}>{format ? format(display) : Math.round(display).toString()}</span>;
}

// ── Sparkline (inline SVG, no deps) ───────────────────────────────────────────
export function Sparkline({
  data,
  width = 56,
  height = 18,
  stroke = "var(--color-data)",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / rng) * (height - 2) - 1}`)
    .join(" ");
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Build a believable 30-pt Brent trend that ramps to the shocked price when a scenario is live. */
export function brentTrend(brent: number, shocked?: number): number[] {
  const arr = Array.from({ length: 30 }, (_, i) => brent * (1 + 0.012 * Math.sin(i * 0.7)));
  if (shocked && shocked > brent) {
    for (let k = 23; k < 30; k++) arr[k] = lerp(brent, shocked, (k - 23) / 6);
  }
  return arr;
}
