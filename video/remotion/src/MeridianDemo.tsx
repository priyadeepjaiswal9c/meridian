import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { captions } from "./captions";

export type DemoProps = {
  durationInSeconds: number;
  withVoiceover: boolean;
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, Inter, system-ui, sans-serif";
const MONO = "ui-monospace, 'SF Mono', monospace";
const INK = "#0b0f16";

// ── Brand mark (top-left, whole video) ──────────────────────────────────────
const Watermark: React.FC = () => (
  <div style={{ position: "absolute", top: 34, left: 40, display: "flex", alignItems: "center", gap: 10 }}>
    <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="12.5" stroke="#fff" strokeWidth="1.2" />
      <ellipse cx="15" cy="15" rx="5" ry="12.5" stroke="#4c90f0" strokeWidth="1" />
      <line x1="2.5" y1="15" x2="27.5" y2="15" stroke="#4c90f0" strokeWidth="1" />
    </svg>
    <span style={{ fontFamily: SERIF, color: "#fff", fontSize: 22, fontWeight: 600, opacity: 0.92 }}>Meridian</span>
  </div>
);

// ── Lower-third caption chip ────────────────────────────────────────────────
const CaptionChip: React.FC<{ kicker: string; text: string }> = ({ kicker, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inN = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  const y = interpolate(inN, [0, 1], [24, 0]);
  return (
    <div style={{ position: "absolute", left: 40, bottom: 56, transform: `translateY(${y}px)`, opacity: inN }}>
      <div
        style={{
          background: "rgba(11,15,22,0.82)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 12,
          padding: "14px 20px",
          maxWidth: 900,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 1.5, color: "#4c90f0", marginBottom: 6 }}>{kicker}</div>
        <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{text}</div>
      </div>
    </div>
  );
};

// ── Intro / outro full-frame cards ──────────────────────────────────────────
const Card: React.FC<{ big: React.ReactNode; sub?: string; fadeOut?: boolean }> = ({ big, sub, fadeOut }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const appear = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const leave = fadeOut ? interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: INK, justifyContent: "center", alignItems: "center", opacity: Math.min(appear, leave) }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, color: "#fff", fontSize: 72, fontWeight: 600 }}>{big}</div>
        {sub && <div style={{ fontFamily: SANS, color: "#a4adba", fontSize: 24, marginTop: 14 }}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

export const MeridianDemo: React.FC<DemoProps> = ({ withVoiceover }) => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {/* the screen-capture, full frame */}
      <OffthreadVideo
        src={staticFile("capture.webm")}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {withVoiceover && <Audio src={staticFile("vo.wav")} />}

      <Watermark />

      {captions.map((c, i) => (
        <Sequence key={i} from={Math.round(c.fromSec * fps)} durationInFrames={Math.round(c.durSec * fps)}>
          <CaptionChip kicker={c.kicker} text={c.text} />
        </Sequence>
      ))}

      {/* intro (fades out over the opening globe) */}
      <Sequence from={0} durationInFrames={70}>
        <Card big={<><span style={{ letterSpacing: 6 }}>MERIDIAN</span></>} sub="National Energy Resilience Intelligence" fadeOut />
      </Sequence>

      {/* outro */}
      <Sequence from={durationInFrames - 80} durationInFrames={80}>
        <Card big={<>Meridian <span style={{ color: "#4c90f0" }}>closes the loop</span>.</>} sub="ET AI Hackathon 2.0 · Problem #2" />
      </Sequence>
    </AbsoluteFill>
  );
};
