import type {
  Chokepoint,
  Corridor,
  Port,
  Refinery,
  SupplierRegion,
} from "@/lib/types";

// National reference constants (indicative, sourced from PPAC / IEA / public reporting).
export const NATIONAL = {
  crudeImportDependencyPct: 88, // share of crude that is imported
  hormuzSharePct: 42, // ~40–45% of India's crude transits the Strait of Hormuz
  reserveDays: 9.5, // strategic petroleum reserve cover (ISPRL)
  dailyConsumptionMbpd: 5.4, // refined product consumption, million barrels/day
  dailyCrudeImportMbpd: 4.7, // crude import, million barrels/day
  brentBaselineUsd: 82.0, // seeded; overridden by live EIA when available
  totalRefiningMMTPA: 256,
};

// ── Major Indian refineries ────────────────────────────────────────────────
export const REFINERIES: Refinery[] = [
  { id: "jamnagar", name: "Jamnagar", operator: "Reliance", lng: 69.85, lat: 22.34, capacityMMTPA: 68.2, coast: "west", grades: ["sour", "medium"] },
  { id: "vadinar", name: "Vadinar", operator: "Nayara Energy", lng: 69.72, lat: 22.28, capacityMMTPA: 20.0, coast: "west", grades: ["sour", "medium"] },
  { id: "koyali", name: "Koyali", operator: "IOCL", lng: 73.13, lat: 22.40, capacityMMTPA: 13.7, coast: "inland", grades: ["medium"] },
  { id: "mumbai-bpcl", name: "Mumbai", operator: "BPCL", lng: 72.86, lat: 19.04, capacityMMTPA: 12.0, coast: "west", grades: ["sour", "medium"] },
  { id: "mumbai-hpcl", name: "Mumbai", operator: "HPCL", lng: 72.84, lat: 19.00, capacityMMTPA: 9.5, coast: "west", grades: ["sour"] },
  { id: "mangalore", name: "Mangalore", operator: "MRPL", lng: 74.83, lat: 12.92, capacityMMTPA: 15.0, coast: "west", grades: ["sour", "medium"] },
  { id: "kochi", name: "Kochi", operator: "BPCL", lng: 76.27, lat: 9.97, capacityMMTPA: 15.5, coast: "west", grades: ["sour", "medium"] },
  { id: "visakh", name: "Visakhapatnam", operator: "HPCL", lng: 83.21, lat: 17.69, capacityMMTPA: 15.0, coast: "east", grades: ["sour", "medium"] },
  { id: "chennai", name: "Chennai (Manali)", operator: "CPCL", lng: 80.26, lat: 13.16, capacityMMTPA: 10.5, coast: "east", grades: ["sour", "medium"] },
  { id: "paradip", name: "Paradip", operator: "IOCL", lng: 86.67, lat: 20.26, capacityMMTPA: 15.0, coast: "east", grades: ["sour", "medium"] },
  { id: "haldia", name: "Haldia", operator: "IOCL", lng: 88.06, lat: 22.03, capacityMMTPA: 8.0, coast: "east", grades: ["medium"] },
  { id: "panipat", name: "Panipat", operator: "IOCL", lng: 76.97, lat: 29.39, capacityMMTPA: 15.0, coast: "inland", grades: ["sour", "medium"] },
  { id: "mathura", name: "Mathura", operator: "IOCL", lng: 77.67, lat: 27.49, capacityMMTPA: 8.0, coast: "inland", grades: ["medium"] },
  { id: "bina", name: "Bina", operator: "BPCL", lng: 78.21, lat: 24.18, capacityMMTPA: 7.8, coast: "inland", grades: ["sour", "medium"] },
  { id: "bathinda", name: "Bathinda", operator: "HMEL", lng: 74.95, lat: 30.21, capacityMMTPA: 11.3, coast: "inland", grades: ["sour", "medium"] },
];

// ── Crude-handling ports ───────────────────────────────────────────────────
export const PORTS: Port[] = [
  { id: "sikka", name: "Sikka", lng: 69.83, lat: 22.43, coast: "west" },
  { id: "vadinar-port", name: "Vadinar", lng: 69.73, lat: 22.27, coast: "west" },
  { id: "kandla", name: "Kandla (Deendayal)", lng: 70.22, lat: 23.03, coast: "west" },
  { id: "mumbai-port", name: "Mumbai", lng: 72.95, lat: 18.95, coast: "west" },
  { id: "new-mangalore", name: "New Mangalore", lng: 74.80, lat: 12.92, coast: "west" },
  { id: "cochin-port", name: "Cochin", lng: 76.26, lat: 9.96, coast: "west" },
  { id: "visakh-port", name: "Visakhapatnam", lng: 83.28, lat: 17.69, coast: "east" },
  { id: "chennai-port", name: "Chennai", lng: 80.30, lat: 13.10, coast: "east" },
  { id: "paradip-port", name: "Paradip", lng: 86.68, lat: 20.26, coast: "east" },
];

// ── Maritime chokepoints ───────────────────────────────────────────────────
export const CHOKEPOINTS: Chokepoint[] = [
  { id: "hormuz", name: "Strait of Hormuz", lng: 56.25, lat: 26.57, indiaCrudeSharePct: 42, note: "≈40–45% of India's crude transits here — the single largest structural exposure." },
  { id: "bab", name: "Bab-el-Mandeb (Red Sea)", lng: 43.33, lat: 12.58, indiaCrudeSharePct: 18, note: "Red Sea / Suez route for Russian & Mediterranean barrels — Houthi-exposed." },
  { id: "malacca", name: "Strait of Malacca", lng: 102.9, lat: 1.43, indiaCrudeSharePct: 6, note: "Far-East flows and some inbound product cargoes." },
  { id: "cape", name: "Cape of Good Hope", lng: 18.47, lat: -34.36, indiaCrudeSharePct: 0, note: "Primary reroute when Hormuz / Red Sea are disrupted — adds ~12–18 transit days." },
];

// ── Crude supplier regions ─────────────────────────────────────────────────
export const SUPPLIERS: SupplierRegion[] = [
  { id: "saudi", name: "Saudi Arabia — Ras Tanura", country: "Saudi Arabia", lng: 50.16, lat: 26.70, grade: "sour", apiGravity: 32 },
  { id: "iraq", name: "Iraq — Basra", country: "Iraq", lng: 48.0, lat: 30.0, grade: "sour", apiGravity: 30 },
  { id: "uae", name: "UAE — Fujairah / Das", country: "UAE", lng: 56.35, lat: 25.20, grade: "medium", apiGravity: 40 },
  { id: "kuwait", name: "Kuwait — Mina al-Ahmadi", country: "Kuwait", lng: 48.13, lat: 29.07, grade: "sour", apiGravity: 31 },
  { id: "russia", name: "Russia — Novorossiysk (Urals)", country: "Russia", lng: 37.80, lat: 44.72, grade: "medium", apiGravity: 31 },
  { id: "nigeria", name: "Nigeria — Bonny", country: "Nigeria", lng: 7.16, lat: 4.42, grade: "sweet", apiGravity: 36 },
  { id: "usa", name: "USA — US Gulf (WTI)", country: "USA", lng: -95.0, lat: 29.3, grade: "sweet", apiGravity: 40 },
  { id: "brazil", name: "Brazil — Santos (Tupi)", country: "Brazil", lng: -43.2, lat: -23.9, grade: "medium", apiGravity: 29 },
];

// ── Supply corridors (supplier → chokepoints → refinery) ───────────────────
// Note: UAE/Fujairah deliberately sits OUTSIDE Hormuz — a real-world Hormuz hedge.
export const CORRIDORS: Corridor[] = [
  {
    id: "saudi-jamnagar", name: "Ras Tanura → Jamnagar", supplierId: "saudi", destRefineryId: "jamnagar",
    path: [[50.16, 26.70], [54.5, 26.9], [56.25, 26.57], [61, 24.5], [66, 23], [69.85, 22.34]],
    chokepointIds: ["hormuz"], baselineSharePct: 18, transitDays: 5, grade: "sour", premiumUsdBbl: 1.5,
  },
  {
    id: "iraq-mumbai", name: "Basra → Mumbai", supplierId: "iraq", destRefineryId: "mumbai-bpcl",
    path: [[48.0, 30.0], [50.5, 28.8], [56.25, 26.57], [62, 23], [72.86, 19.04]],
    chokepointIds: ["hormuz"], baselineSharePct: 14, transitDays: 6, grade: "sour", premiumUsdBbl: 1.0,
  },
  {
    id: "kuwait-koyali", name: "Mina al-Ahmadi → Koyali", supplierId: "kuwait", destRefineryId: "koyali",
    path: [[48.13, 29.07], [51, 28], [56.25, 26.57], [62, 24], [70.5, 22.6], [73.13, 22.40]],
    chokepointIds: ["hormuz"], baselineSharePct: 6, transitDays: 6, grade: "sour", premiumUsdBbl: 1.1,
  },
  {
    id: "uae-mangalore", name: "Fujairah → Mangalore (Hormuz-bypass)", supplierId: "uae", destRefineryId: "mangalore",
    path: [[56.35, 25.20], [60, 23], [66, 18], [74.83, 12.92]],
    chokepointIds: [], baselineSharePct: 8, transitDays: 4, grade: "medium", premiumUsdBbl: 1.2,
  },
  {
    id: "russia-vadinar", name: "Novorossiysk → Vadinar (Red Sea)", supplierId: "russia", destRefineryId: "vadinar",
    path: [[37.80, 44.72], [28, 40.5], [32.5, 31], [43.33, 12.58], [58, 17], [69.72, 22.28]],
    chokepointIds: ["bab"], baselineSharePct: 20, transitDays: 18, grade: "medium", premiumUsdBbl: -3.0,
  },
  {
    id: "nigeria-paradip", name: "Bonny → Paradip (Cape)", supplierId: "nigeria", destRefineryId: "paradip",
    path: [[7.16, 4.42], [9, -16], [18.47, -34.36], [42, -22], [72, 6], [86.67, 20.26]],
    chokepointIds: ["cape"], baselineSharePct: 5, transitDays: 22, grade: "sweet", premiumUsdBbl: 2.5,
  },
  {
    id: "usa-jamnagar", name: "US Gulf → Jamnagar (Cape)", supplierId: "usa", destRefineryId: "jamnagar",
    path: [[-95.0, 29.3], [-55, 12], [-18, -12], [18.47, -34.36], [46, -14], [69.85, 22.34]],
    chokepointIds: ["cape"], baselineSharePct: 3, transitDays: 38, grade: "sweet", premiumUsdBbl: 3.5,
  },
  {
    id: "brazil-visakh", name: "Santos → Visakhapatnam (Cape)", supplierId: "brazil", destRefineryId: "visakh",
    path: [[-43.2, -23.9], [-20, -32], [18.47, -34.36], [50, -18], [78, 12], [83.21, 17.69]],
    chokepointIds: ["cape"], baselineSharePct: 2, transitDays: 30, grade: "medium", premiumUsdBbl: 2.0,
  },
];

// ── Lookups ────────────────────────────────────────────────────────────────
export const refineryById = (id: string) => REFINERIES.find((r) => r.id === id);
export const corridorById = (id: string) => CORRIDORS.find((c) => c.id === id);
export const chokepointById = (id: string) => CHOKEPOINTS.find((c) => c.id === id);
export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id);

/** Corridors that pass through a given chokepoint. */
export const corridorsThroughChokepoint = (chokepointId: string) =>
  CORRIDORS.filter((c) => c.chokepointIds.includes(chokepointId));

/** Map centre + initial view for the digital twin (India + Arabian Sea + Gulf). */
export const MAP_INITIAL_VIEW = {
  longitude: 63,
  latitude: 19,
  zoom: 3.4,
  pitch: 38,
  bearing: 0,
};
