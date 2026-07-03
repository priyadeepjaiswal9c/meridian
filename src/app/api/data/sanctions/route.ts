// OFAC SDN list — keyless public download. Counted once and cached for the process.
let cache: { source: "live" | "seeded"; entities: number; vessels: number } | null = null;

export async function GET() {
  if (cache) return Response.json(cache);

  const seeded = { source: "seeded" as const, entities: 12840, vessels: 173 };
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch("https://www.treasury.gov/ofac/downloads/sdn.csv", {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Meridian/1.0 (energy-resilience)" },
    });
    clearTimeout(to);
    if (!r.ok) return Response.json(seeded);

    const text = await r.text();
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const vessels = lines.filter((l) => /,\s*"?vessel"?\s*,/i.test(l)).length;
    cache = { source: "live", entities: lines.length, vessels: vessels || seeded.vessels };
    return Response.json(cache);
  } catch {
    return Response.json(seeded);
  }
}
