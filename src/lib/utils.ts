import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** basePath prefix for raw (non-next/link) hrefs — empty in dev, "/meridian" on GitHub Pages. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const withBase = (p: string) => `${BASE_PATH}${p}`;

/** USD/barrel, e.g. $82.40 */
export function fmtUsd(n: number, dp = 2) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

/** Indian rupee, e.g. ₹1.2L cr / ₹98.40 */
export function fmtInr(n: number, dp = 2) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

/** Compact INR crore/lakh-crore for big economic numbers. */
export function fmtInrCrore(crore: number) {
  if (Math.abs(crore) >= 100000) return `₹${(crore / 100000).toFixed(2)}L cr`;
  return `₹${crore.toLocaleString("en-IN", { maximumFractionDigits: 0 })} cr`;
}

/** Signed percentage, e.g. +8.4% / −3.1% */
export function fmtPct(n: number, dp = 1) {
  const s = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${s}${Math.abs(n).toFixed(dp)}%`;
}

/** Clamp a number to [min, max]. */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Linear interpolate. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Great-circle distance in km between two [lng,lat] points (Haversine). */
export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(a[0] - b[0]) * -1;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Format a clock-ish relative timestamp for the live feed. */
export function fmtClock(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
