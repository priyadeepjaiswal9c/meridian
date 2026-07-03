import { NATIONAL } from "@/lib/geo/india";

// EIA v2 daily spot prices — Brent (RBRTE) & WTI (RWTC). Free key; seeded fallback.
export async function GET() {
  const key = process.env.EIA_API_KEY;
  const seeded = {
    source: "seeded" as const,
    brent: NATIONAL.brentBaselineUsd,
    wti: NATIONAL.brentBaselineUsd - 4.4,
    series: [] as { date: string; brent: number }[],
  };
  if (!key) return Response.json(seeded);

  try {
    const url =
      `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${key}` +
      `&frequency=daily&data[]=value` +
      `&facets[series][]=RBRTE&facets[series][]=RWTC` +
      `&sort[0][column]=period&sort[0][direction]=desc&length=120`;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    clearTimeout(to);
    if (!r.ok) return Response.json(seeded);
    const j = await r.json();
    const rows: { period: string; series: string; value: number }[] = j?.response?.data ?? [];
    if (!rows.length) return Response.json(seeded);

    const brentRows = rows.filter((d) => d.series === "RBRTE" && d.value != null);
    const wtiRows = rows.filter((d) => d.series === "RWTC" && d.value != null);
    const brent = brentRows[0]?.value ?? seeded.brent;
    const wti = wtiRows[0]?.value ?? seeded.wti;
    const series = brentRows
      .slice(0, 30)
      .reverse()
      .map((d) => ({ date: d.period, brent: d.value }));

    return Response.json({ source: "live", brent, wti, series });
  } catch {
    return Response.json(seeded);
  }
}
