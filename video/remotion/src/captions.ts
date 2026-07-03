// Lower-third captions, timed to the capture. Tweak fromSec to match your recording —
// the capture prints ⏱ milestone marks; these are timed to the 2026-07-03 capture
// (50.3s raw, trimSeconds 3.8 → beats: scroll 5.3 · console 15.4/23.0 · simulate 24.5 ·
//  run done 30.6 · approve 35.6 · end 46.5).
export type Caption = { fromSec: number; durSec: number; kicker: string; text: string };

export const captions: Caption[] = [
  { fromSec: 1.5, durSec: 4.5, kicker: "THE EXPOSURE", text: "88% of India's crude is imported — 42% via one strait" },
  { fromSec: 8, durSec: 4.5, kicker: "THE GAP", text: "Every sensor saw the 2025 shock. None of them acted." },
  { fromSec: 19.5, durSec: 4, kicker: "THE CONSOLE", text: "A live digital twin of India's energy supply" },
  { fromSec: 25, durSec: 3, kicker: "SENSE", text: "Fuse geopolitical, maritime, market & sanctions signals" },
  { fromSec: 28, durSec: 3, kicker: "REASON", text: "Model the cascade: crude → refinery → pump → GDP" },
  { fromSec: 31, durSec: 3.5, kicker: "VERIFY", text: "Russian Urals auto-rejected (price cap) · Fujairah bypass promoted" },
  { fromSec: 34.5, durSec: 3, kicker: "ACT", text: "Signal → verified, executable plan in seconds" },
  { fromSec: 38, durSec: 4, kicker: "CLOSE THE LOOP", text: "Approve — cargo committed, exposure eases" },
];
