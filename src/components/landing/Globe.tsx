"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import gsap from "gsap";
import { CHOKEPOINTS, CORRIDORS, REFINERIES, SUPPLIERS } from "@/lib/geo/india";
import { useMeridian } from "@/lib/store";

// COBE v2: no internal rAF — we drive every frame via globe.update() from gsap's
// ticker. Coordinates are [lat, lng]; our geo data is [lng, lat] — flip everywhere.
// A FRESH canvas element is created for every (re)build — COBE can't re-initialise
// a canvas whose WebGL context it already used — and the buffer is sized to the
// measured square so the globe is always a perfect circle.

const NAVY: [number, number, number] = [0.12, 0.23, 0.37];
const AMBER: [number, number, number] = [0.72, 0.42, 0.06];
const RED: [number, number, number] = [0.78, 0.21, 0.17];
const SLATE: [number, number, number] = [0.58, 0.63, 0.69];
// dark-theme variants
const NAVY_D: [number, number, number] = [0.54, 0.71, 0.91];
const RED_D: [number, number, number] = [0.91, 0.42, 0.43];
const SLATE_D: [number, number, number] = [0.41, 0.46, 0.53];

export function Globe({ size = 560, className }: { size?: number; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const theme = useMeridian((s) => s.theme);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const dark = theme === "dark";
    const hormuz = CHOKEPOINTS.find((c) => c.id === "hormuz")!;

    // rotation state survives rebuilds (resize)
    let phi = 3.6;
    let theta = 0.22;
    let velPhi = 0;
    let pointerDown = false;
    let lastX = 0;
    let lastY = 0;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let destroyed = false;
    let builtAt = 0;

    const build = () => {
      if (destroyed) return;
      const px = Math.max(120, Math.min(wrap.clientWidth, size));
      if (px < 140) return; // layout not settled yet — RO will call us again
      builtAt = px;
      globe?.destroy();
      canvas?.remove();
      canvas = document.createElement("canvas");
      canvas.style.cssText = `width:${px}px;height:${px}px;opacity:0;contain:layout paint size;`;
      canvas.setAttribute(
        "aria-label",
        "Interactive globe of India's crude supply corridors; red routes transit the Strait of Hormuz. Drag to rotate freely.",
      );
      wrap.appendChild(canvas);
      globe = createGlobe(canvas, {
        width: px * 2,
        height: px * 2,
        phi,
        theta,
        dark: dark ? 1 : 0,
        diffuse: 1.2,
        mapSamples: 20000,
        mapBrightness: dark ? 5.6 : 3.6,
        mapBaseBrightness: dark ? 0.06 : 0.04,
        baseColor: dark ? [0.16, 0.19, 0.25] : [0.9, 0.92, 0.95],
        glowColor: dark ? [0.07, 0.09, 0.14] : [0.985, 0.985, 0.99],
        markerColor: dark ? NAVY_D : NAVY,
        opacity: dark ? 0.92 : 0.96,
        devicePixelRatio: 2,
        markers: [
          ...REFINERIES.filter((r) => r.coast !== "inland").map((r) => ({
            location: [r.lat, r.lng] as [number, number],
            size: 0.045,
            color: dark ? NAVY_D : NAVY,
          })),
          ...SUPPLIERS.map((s) => ({
            location: [s.lat, s.lng] as [number, number],
            size: 0.05,
            color: dark ? SLATE_D : SLATE,
          })),
          { location: [hormuz.lat, hormuz.lng] as [number, number], size: 0.09, color: AMBER },
        ],
        arcs: CORRIDORS.map((c) => {
          const from = c.path[0];
          const to = c.path[c.path.length - 1];
          return {
            from: [from[1], from[0]] as [number, number],
            to: [to[1], to[0]] as [number, number],
            color: c.chokepointIds.includes("hormuz") ? (dark ? RED_D : RED) : dark ? NAVY_D : NAVY,
          };
        }),
        arcWidth: 0.9,
        arcHeight: 0.28,
      });
      gsap.to(canvas, { opacity: 1, duration: 0.9, ease: "power2.out", delay: 0.05 });
    };

    // wait one frame so the grid has laid out before first measure
    requestAnimationFrame(build);

    const tick = () => {
      if (!pointerDown) phi += 0.0028 + velPhi;
      velPhi *= 0.94;
      globe?.update({ phi, theta });
    };
    gsap.ticker.add(tick);

    // free rotation: horizontal drag = unlimited spin (phi), vertical = tilt (theta)
    const onDown = (e: PointerEvent) => {
      pointerDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      wrap.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!pointerDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      phi += dx * 0.0055;
      theta = Math.max(-1.35, Math.min(1.35, theta + dy * 0.004));
      velPhi = dx * 0.00045;
    };
    const onUp = () => {
      pointerDown = false;
      wrap.style.cursor = "grab";
    };
    wrap.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    // keep it a perfect circle on any layout change
    let resizeT: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      const px = Math.max(120, Math.min(wrap.clientWidth, size));
      if (Math.abs(px - builtAt) < 4) return; // no meaningful change
      clearTimeout(resizeT);
      resizeT = setTimeout(build, 180);
    });
    ro.observe(wrap);

    return () => {
      destroyed = true;
      clearTimeout(resizeT);
      ro.disconnect();
      gsap.ticker.remove(tick);
      wrap.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      globe?.destroy();
      canvas?.remove();
    };
  }, [size, theme]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "grab",
        touchAction: "none",
      }}
    />
  );
}
