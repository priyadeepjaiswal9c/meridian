import type { RiskSignal, Severity } from "@/lib/types";

// GDELT DOC 2.0 — keyless real-time global news. Proxied server-side (avoids CORS).
interface GdeltArticle {
  title: string;
  url: string;
  domain: string;
  seendate: string;
}

function classify(title: string): { severity: Severity; chokepointId?: string; corridorId?: string } {
  const t = title.toLowerCase();
  const hot = /(attack|strike|closure|closed|seize|seized|missile|explosion|war|blockade|suspend)/.test(t);
  const warm = /(sanction|tension|threat|disrupt|halt|drone|escalat|tariff|embargo)/.test(t);
  const severity: Severity = hot ? "high" : warm ? "elevated" : "low";
  const chokepointId = /hormuz/.test(t) ? "hormuz" : /red sea|bab|suez|houthi/.test(t) ? "bab" : undefined;
  return { severity, chokepointId };
}

export async function GET() {
  const query =
    '("Strait of Hormuz" OR "crude oil" OR OPEC OR "oil tanker" OR "Red Sea shipping" OR "oil sanctions" OR "oil price") sourcelang:english';
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}` +
    `&mode=ArtList&maxrecords=24&timespan=3d&sort=DateDesc&format=json`;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Meridian/1.0 (energy-resilience)" } });
    clearTimeout(to);
    const ct = r.headers.get("content-type") ?? "";
    if (!r.ok || !ct.includes("json")) return Response.json({ source: "seeded", signals: [] });

    const j = await r.json();
    const arts: GdeltArticle[] = j?.articles ?? [];

    // de-dupe by domain so the feed isn't all one outlet
    const seen = new Set<string>();
    const picked: GdeltArticle[] = [];
    for (const a of arts) {
      if (!a.title || seen.has(a.domain)) continue;
      seen.add(a.domain);
      picked.push(a);
      if (picked.length >= 6) break;
    }

    const now = Date.now();
    const signals: RiskSignal[] = picked.map((a, i) => {
      const { severity, chokepointId } = classify(a.title);
      return {
        id: `gdelt-${now}-${i}`,
        ts: now - i * 1000,
        source: "GDELT",
        title: a.title.length > 96 ? a.title.slice(0, 93) + "…" : a.title,
        detail: `${a.domain} · live GDELT feed`,
        severity,
        confidence: 0.7,
        chokepointId,
      };
    });

    return Response.json({ source: "live", count: arts.length, signals });
  } catch {
    return Response.json({ source: "seeded", signals: [] });
  }
}
