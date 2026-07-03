// Lower-third captions, timed to the capture. Tweak fromSec to match your recording —
// the capture prints its length; nudge these until they land on each beat.
export type Caption = { fromSec: number; durSec: number; kicker: string; text: string };

export const captions: Caption[] = [
  { fromSec: 1.5, durSec: 4, kicker: "THE EXPOSURE", text: "88% of India's crude is imported — 42% via one strait" },
  { fromSec: 6.5, durSec: 4, kicker: "THE GAP", text: "Every sensor saw the 2025 shock. None of them acted." },
  { fromSec: 13, durSec: 3.5, kicker: "THE CONSOLE", text: "A live digital twin of India's energy supply" },
  { fromSec: 18, durSec: 4, kicker: "SENSE", text: "Fuse geopolitical, maritime, market & sanctions signals" },
  { fromSec: 23, durSec: 4, kicker: "REASON", text: "Model the cascade: crude → refinery → pump → GDP" },
  { fromSec: 28, durSec: 4.5, kicker: "VERIFY", text: "Russian Urals auto-rejected (price cap) · Fujairah bypass promoted" },
  { fromSec: 34, durSec: 3.5, kicker: "ACT", text: "Signal → verified, executable plan in seconds" },
  { fromSec: 39, durSec: 4, kicker: "CLOSE THE LOOP", text: "Approve — cargo committed, exposure eases" },
];
