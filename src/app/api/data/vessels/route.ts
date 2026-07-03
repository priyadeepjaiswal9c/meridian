import type { LiveVessel } from "@/lib/types";

// AISStream.io live vessel positions (free key). Serverless can't hold a socket open,
// so we burst-sample: open the WebSocket, subscribe to the Gulf→India box, collect
// position reports for ~4.5s, close, and cache for 2 minutes. Seeded-safe without a key.

let cache: { ts: number; payload: { source: string; vessels: LiveVessel[] } } | null = null;

export async function GET() {
  const key = process.env.AISSTREAM_API_KEY;
  if (!key) return Response.json({ source: "seeded", vessels: [] });
  if (cache && Date.now() - cache.ts < 120_000) return Response.json(cache.payload);

  const vessels = await new Promise<LiveVessel[]>((resolve) => {
    const out = new Map<string, LiveVessel>();
    let settled = false;
    let ws: WebSocket | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        ws?.close();
      } catch {}
      resolve([...out.values()]);
    };
    const timer = setTimeout(finish, 4500);

    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      ws.onopen = () =>
        ws?.send(
          JSON.stringify({
            APIKey: key,
            // [lat, lng] pairs — Persian Gulf + Arabian Sea + Indian coasts
            BoundingBoxes: [[[5, 40], [30, 80]]],
            FilterMessageTypes: ["PositionReport"],
          }),
        );
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(String(e.data));
          if (m.MessageType !== "PositionReport") return;
          const p = m.Message?.PositionReport;
          if (!p || typeof p.Longitude !== "number") return;
          out.set(String(p.UserID), {
            id: String(p.UserID),
            lng: p.Longitude,
            lat: p.Latitude,
            heading: typeof p.TrueHeading === "number" ? p.TrueHeading : 0,
          });
          if (out.size >= 120) {
            clearTimeout(timer);
            finish();
          }
        } catch {}
      };
      ws.onerror = () => {
        clearTimeout(timer);
        finish();
      };
      ws.onclose = () => {
        clearTimeout(timer);
        finish();
      };
    } catch {
      clearTimeout(timer);
      finish();
    }
  });

  const payload = { source: vessels.length ? "live" : "seeded", vessels };
  if (vessels.length) cache = { ts: Date.now(), payload };
  return Response.json(payload);
}
