"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, PathLayer, TextLayer, ArcLayer } from "@deck.gl/layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import type { PickingInfo, Layer } from "@deck.gl/core";
import {
  CHOKEPOINTS,
  CORRIDORS,
  MAP_INITIAL_VIEW,
  PORTS,
  REFINERIES,
  SUPPLIERS,
  corridorById,
  refineryById,
  supplierById,
} from "@/lib/geo/india";
import { generateVessels, pointAlongPath } from "@/lib/data/seed";
import { useMeridian } from "@/lib/store";
import type { Vessel } from "@/lib/types";

// Theme-paired overlay palettes: on light ground data goes darker+saturated with
// paper casings; on dark ground data goes lighter+brighter with ink casings.
type Rgb = [number, number, number];
type Palette = {
  navy: Rgb; blue: Rgb; slate: Rgb; amber: Rgb; red: Rgb; green: Rgb; teal: Rgb;
  ink: Rgb; paper: Rgb; labelBg: [number, number, number, number]; supLabel: [number, number, number, number];
};
const LIGHT: Palette = {
  navy: [30, 58, 95], blue: [15, 98, 254], slate: [148, 160, 176], amber: [180, 105, 16],
  red: [198, 54, 44], green: [14, 138, 95], teal: [13, 118, 128],
  ink: [23, 23, 23], paper: [255, 255, 255],
  labelBg: [255, 255, 255, 215], supLabel: [90, 100, 112, 230],
};
const DARK: Palette = {
  navy: [138, 180, 232], blue: [92, 152, 240], slate: [104, 118, 136], amber: [236, 154, 60],
  red: [231, 106, 110], green: [62, 190, 125], teal: [72, 196, 176],
  ink: [232, 236, 241], paper: [13, 18, 28],
  labelBg: [18, 23, 34, 225], supLabel: [150, 162, 176, 235],
};

const STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

/** Screen padding that keeps the camera's focus clear of the side rails. */
const RAIL_PADDING = { left: 340, right: 385, top: 70, bottom: 60 };

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export default function ConsoleMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vesselsRef = useRef<Vessel[]>(generateVessels());

  // ── Camera choreography: execute Director cues ───────────────────────────
  const cameraCue = useMeridian((s) => s.cameraCue);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cameraCue) return;
    const fly = (opts: maplibregl.FlyToOptions) =>
      map.flyTo({ essential: true, padding: RAIL_PADDING, ...opts });
    if (cameraCue.kind === "focus" && cameraCue.target) {
      fly({ center: cameraCue.target, zoom: 5.3, pitch: 44, bearing: -14, duration: 2600, curve: 1.35 });
    } else if (cameraCue.kind === "reveal") {
      fly({ center: [60, 15.5], zoom: 3.35, pitch: 32, bearing: 0, duration: 3000, curve: 1.25 });
    } else {
      fly({
        center: [MAP_INITIAL_VIEW.longitude, MAP_INITIAL_VIEW.latitude],
        zoom: MAP_INITIAL_VIEW.zoom,
        pitch: 24,
        bearing: 0,
        duration: 2400,
      });
    }
  }, [cameraCue]);

  // Basemap follows the theme
  const theme = useMeridian((s) => s.theme);
  useEffect(() => {
    mapRef.current?.setStyle(STYLES[theme]);
  }, [theme]);

  // Lock user input while the Director is driving
  const directing = useMeridian((s) => s.directing);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handlers = [
      map.scrollZoom,
      map.dragPan,
      map.dragRotate,
      map.doubleClickZoom,
      map.keyboard,
      map.touchZoomRotate,
    ];
    handlers.forEach((h) => (directing ? h.disable() : h.enable()));
  }, [directing]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[useMeridian.getState().theme],
      center: [MAP_INITIAL_VIEW.longitude, MAP_INITIAL_VIEW.latitude],
      zoom: MAP_INITIAL_VIEW.zoom,
      pitch: 24,
      bearing: 0,
      attributionControl: false,
      maxPitch: 60,
      dragRotate: true,
    });
    mapRef.current = map;

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
      getTooltip: (info: PickingInfo) => {
        const o = info.object as
          | { name?: string; operator?: string; capacityMMTPA?: number; class?: string; note?: string }
          | undefined;
        if (!o?.name) return null;
        if (o.operator) return { text: `${o.name} — ${o.operator} · ${o.capacityMMTPA} MMTPA` };
        if (o.class) return { text: `${o.name} · ${o.class}` };
        if (o.note) return { text: `${o.name}\n${o.note}` };
        return { text: o.name };
      },
      onHover: (info: PickingInfo) => {
        if (!useMeridian.getState().directing) {
          map.getCanvas().style.cursor = info.object ? "pointer" : "";
        }
      },
    });
    map.addControl(overlay as unknown as maplibregl.IControl);

    let raf = 0;
    let last = performance.now();

    const buildLayers = (dt: number): Layer[] => {
      const { disrupted, selectedRec, recommendations, liveVessels, ripple, approvedIds, theme: th } =
        useMeridian.getState();
      const C = th === "dark" ? DARK : LIGHT;
      const approved = new Set(
        recommendations.filter((r) => approvedIds.includes(r.id)).map((r) => r.corridorId),
      );
      const recIds = new Set(recommendations.map((r) => r.corridorId));
      const isDisrupted = (corridorId: string) => {
        const c = corridorById(corridorId);
        return !!c && c.chokepointIds.some((cp) => disrupted.includes(cp));
      };
      const nowMs = performance.now();

      // corridors — smooth colour morph via deck.gl transitions
      const corridorPaths = new PathLayer({
        id: "corridors",
        data: CORRIDORS,
        getPath: (c) => c.path,
        getColor: (c) => {
          if (isDisrupted(c.id)) return [...C.red, 210] as [number, number, number, number];
          if (recIds.has(c.id)) return [...C.green, 70] as [number, number, number, number];
          return [...C.slate, 110] as [number, number, number, number];
        },
        getWidth: (c) => (isDisrupted(c.id) ? 2.4 : 1.4),
        widthUnits: "pixels",
        widthMinPixels: 1.1,
        capRounded: true,
        jointRounded: true,
        transitions: { getColor: { duration: 700 }, getWidth: { duration: 700 } },
        updateTriggers: {
          getColor: [disrupted, Array.from(recIds).join(), th],
          getWidth: [disrupted],
        },
      });

      // verified reroutes — sweeping great-circle arcs, supplier → refinery
      const recArcs = new ArcLayer({
        id: "rec-arcs",
        data: recommendations
          .map((r) => {
            const c = corridorById(r.corridorId);
            if (!c) return null;
            const s = supplierById(c.supplierId)!;
            const d = refineryById(c.destRefineryId)!;
            return { id: c.id, from: [s.lng, s.lat], to: [d.lng, d.lat], rank: r.rank };
          })
          .filter(Boolean) as { id: string; from: number[]; to: number[]; rank: number }[],
        getSourcePosition: (d) => d.from as [number, number],
        getTargetPosition: (d) => d.to as [number, number],
        getSourceColor: (d) =>
          [...C.green, approved.has(d.id) || d.id === selectedRec ? 255 : 200] as [number, number, number, number],
        getTargetColor: (d) =>
          [...C.teal, approved.has(d.id) || d.id === selectedRec ? 255 : 200] as [number, number, number, number],
        getWidth: (d) => (approved.has(d.id) ? 5 : d.id === selectedRec ? 4 : d.rank === 1 ? 3 : 2.2),
        getHeight: 0.32,
        greatCircle: true,
        numSegments: 80,
        widthUnits: "pixels",
        transitions: { getWidth: { duration: 200 } },
        updateTriggers: {
          getSourceColor: [selectedRec, approvedIds.join(), th],
          getTargetColor: [selectedRec, approvedIds.join(), th],
          getWidth: [selectedRec, approvedIds.join()],
        },
      });

      // travelling beacons along verified corridors (cargo in motion)
      const recCorridors = CORRIDORS.filter((c) => recIds.has(c.id));
      const recBeacons = new ScatterplotLayer({
        id: "rec-beacons",
        data: recCorridors.map((c, i) => {
          const bt = (nowMs / 5200 + i * 0.33) % 1;
          const [lng, lat] = pointAlongPath(c.path, bt);
          return { lng, lat };
        }),
        getPosition: (d) => [d.lng, d.lat],
        getRadius: 4,
        radiusUnits: "pixels",
        getFillColor: [...C.green, 255] as [number, number, number, number],
        stroked: true,
        getLineColor: [...C.paper, 240] as [number, number, number, number],
        lineWidthMinPixels: 1.5,
      });

      // tanker wakes — animated trails behind each vessel
      const vessels = vesselsRef.current.map((v) => {
        const c = corridorById(v.corridorId!)!;
        const slow = isDisrupted(v.corridorId!) ? 0.25 : 1;
        v.t = (v.t + 0.0009 * slow * dt) % 1;
        const [lng, lat] = pointAlongPath(c.path, v.t);
        return { ...v, lng, lat, blocked: isDisrupted(v.corridorId!) };
      });
      const K = 14;
      const wakes = new TripsLayer({
        id: "wakes",
        data: vessels.map((v) => {
          const c = corridorById(v.corridorId!)!;
          const path: [number, number][] = [];
          const timestamps: number[] = [];
          for (let k = 0; k < K; k++) {
            const tt = Math.max(0, v.t - 0.055 * (1 - k / (K - 1)));
            const [lng, lat] = pointAlongPath(c.path, tt);
            path.push([lng, lat]);
            timestamps.push(k);
          }
          return { path, timestamps, blocked: v.blocked };
        }),
        getPath: (d) => d.path,
        getTimestamps: (d) => d.timestamps,
        getColor: (d) => (d.blocked ? [...C.red, 160] : [...C.blue, 140]) as [number, number, number, number],
        getWidth: 2,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
        trailLength: K - 1,
        currentTime: K - 1,
        fadeTrail: true,
      });
      const vesselLayer = new ScatterplotLayer({
        id: "vessels",
        data: vessels,
        pickable: true,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: (d) => (d.class === "VLCC" ? 4.2 : d.class === "Suezmax" ? 3.4 : 2.8),
        radiusUnits: "pixels",
        radiusMinPixels: 2,
        getFillColor: (d) => (d.blocked ? [...C.red, 255] : [...C.blue, 235]) as [number, number, number, number],
        stroked: true,
        getLineColor: [...C.paper, 240] as [number, number, number, number],
        lineWidthMinPixels: 1.2,
        updateTriggers: { getFillColor: [disrupted] },
      });

      // one-shot crisis ripple at the epicentre (~1.8s, three offset rings)
      const rippleLayers: Layer[] = [];
      if (ripple) {
        const elapsed = (Date.now() - ripple.startedAt) / 1800;
        if (elapsed < 1) {
          const rings = [0, 0.18, 0.36]
            .map((offset) => {
              const p = Math.max(0, Math.min(1, elapsed - offset) / (1 - offset));
              return { p: easeOutCubic(p), offset };
            })
            .filter((r) => r.p > 0 && r.p < 1);
          rippleLayers.push(
            new ScatterplotLayer({
              id: "crisis-ripple",
              data: rings,
              getPosition: () => [ripple.lng, ripple.lat],
              getRadius: (d) => 8 + d.p * 110,
              radiusUnits: "pixels",
              stroked: true,
              filled: false,
              getLineColor: (d) => [...C.red, Math.round(200 * (1 - d.p))] as [number, number, number, number],
              lineWidthMinPixels: 2,
              updateTriggers: { getRadius: [nowMs], getLineColor: [nowMs] },
            }),
          );
        }
      }

      // real AIS constellation
      const liveAis = new ScatterplotLayer({
        id: "live-ais",
        data: liveVessels,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: 1.6,
        radiusUnits: "pixels",
        radiusMinPixels: 1,
        getFillColor: [...C.slate, 120] as [number, number, number, number],
      });

      // chokepoints
      const chokeGlow = new ScatterplotLayer({
        id: "choke-glow",
        data: CHOKEPOINTS.filter((c) => c.indiaCrudeSharePct > 0 || disrupted.includes(c.id)),
        getPosition: (d) => [d.lng, d.lat],
        getRadius: (d) => (disrupted.includes(d.id) ? 22 : 14),
        radiusUnits: "pixels",
        getFillColor: (d) =>
          (disrupted.includes(d.id) ? [...C.red, 40] : [...C.amber, 30]) as [number, number, number, number],
        transitions: { getFillColor: { duration: 600 }, getRadius: { duration: 600 } },
        updateTriggers: { getFillColor: [disrupted, th], getRadius: [disrupted] },
      });
      const chokeCore = new ScatterplotLayer({
        id: "choke-core",
        data: CHOKEPOINTS,
        pickable: true,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: 4.2,
        radiusUnits: "pixels",
        getFillColor: (d) =>
          (disrupted.includes(d.id) ? [...C.red, 255] : [...C.amber, 235]) as [number, number, number, number],
        stroked: true,
        getLineColor: [...C.paper, 255] as [number, number, number, number],
        lineWidthMinPixels: 1.6,
        updateTriggers: { getFillColor: [disrupted, th] },
      });

      // refineries / ports / suppliers
      const refineryLayer = new ScatterplotLayer({
        id: "refineries",
        data: REFINERIES,
        pickable: true,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: (d) => 2.4 + d.capacityMMTPA / 14,
        radiusUnits: "pixels",
        radiusMinPixels: 2.5,
        getFillColor: [...C.navy, 230] as [number, number, number, number],
        stroked: true,
        getLineColor: [...C.paper, 240] as [number, number, number, number],
        lineWidthMinPixels: 1.2,
      });
      const portLayer = new ScatterplotLayer({
        id: "ports",
        data: PORTS,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: 2,
        radiusUnits: "pixels",
        radiusMinPixels: 1.5,
        getFillColor: [...C.slate, 170] as [number, number, number, number],
      });
      const supplierLayer = new ScatterplotLayer({
        id: "suppliers",
        data: SUPPLIERS,
        pickable: true,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: 4,
        radiusUnits: "pixels",
        radiusMinPixels: 3,
        getFillColor: [...C.paper, 255] as [number, number, number, number],
        stroked: true,
        getLineColor: [...C.ink, 200] as [number, number, number, number],
        lineWidthMinPixels: 1.4,
      });

      const labelLayer = new TextLayer({
        id: "labels",
        data: [
          ...CHOKEPOINTS.map((c) => ({ text: c.name, lng: c.lng, lat: c.lat, kind: "choke", id: c.id })),
          ...SUPPLIERS.map((s) => ({ text: s.country, lng: s.lng, lat: s.lat, kind: "sup", id: s.id })),
        ],
        getPosition: (d) => [d.lng, d.lat],
        getText: (d) => d.text,
        getSize: (d) => (d.kind === "choke" ? 11 : 10),
        sizeUnits: "pixels",
        getColor: (d) =>
          (d.kind === "choke" && disrupted.includes(d.id)
            ? [...C.red, 255]
            : d.kind === "choke"
              ? [...C.amber, 255]
              : C.supLabel) as [number, number, number, number],
        getPixelOffset: [0, -14],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 600,
        characterSet: "auto",
        background: true,
        getBackgroundColor: C.labelBg,
        backgroundPadding: [5, 2.5],
        updateTriggers: { getColor: [disrupted, th], getBackgroundColor: [th] },
      });

      return [
        corridorPaths,
        chokeGlow,
        refineryLayer,
        portLayer,
        liveAis,
        wakes,
        vesselLayer,
        recArcs,
        recBeacons,
        supplierLayer,
        chokeCore,
        labelLayer,
        ...rippleLayers,
      ];
    };

    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      overlay.setProps({ layers: buildLayers(dt) });
      raf = requestAnimationFrame(loop);
    };

    map.on("load", () => {
      raf = requestAnimationFrame(loop);
    });

    // expose camera controls for the on-map control cluster
    useMeridian.getState().setMapApi({
      zoomIn: () => map.zoomIn({ duration: 280 }),
      zoomOut: () => map.zoomOut({ duration: 280 }),
      reset: () =>
        map.flyTo({
          center: [MAP_INITIAL_VIEW.longitude, MAP_INITIAL_VIEW.latitude],
          zoom: MAP_INITIAL_VIEW.zoom,
          pitch: 24,
          bearing: 0,
          duration: 1600,
          essential: true,
        }),
      togglePitch: () =>
        map.easeTo({ pitch: map.getPitch() > 12 ? 0 : 48, duration: 650, essential: true }),
    });

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      useMeridian.getState().setMapApi(null);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
