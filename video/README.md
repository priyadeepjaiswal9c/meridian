# Meridian — demo video kit

A **fully automated, free** pipeline: Playwright records the app, Remotion turns that raw footage
into a produced MP4 (title cards, timed captions, optional voiceover). Everything below is free
(Remotion is free for individuals/teams ≤3; macOS TTS + ffmpeg/afconvert are free).

## One-time
```bash
# from the meridian/ app root, in one terminal:
npm run dev                                   # serves the app on :3000

# in another terminal:
npm i -D playwright && npx playwright install chromium
```

## 1 · Capture the footage (automated)
```bash
node video/capture.mjs        # drives landing → console → simulate → approve, HEADED
```
→ writes `video/remotion/public/capture.webm`. Note the clip length (≈40–60s).
*(Runs headed so the WebGL globe + map render. For a slicker take, tweak the `sleep(...)` beats
in `capture.mjs`, or drive it manually and drop your own recording in as `capture.webm`.)*

## 2 · (optional) Voiceover — free macOS TTS
```bash
bash video/narrate.sh                 # or:  bash video/narrate.sh "Ava (Premium)"
```
→ writes `video/remotion/public/vo.wav` from `video/narration.txt`.
Then set `"withVoiceover": true` in `video/remotion/props.json`.
*(Prefer your own voice? Record over the muted video instead — judges trust a real voice. Or use
[ElevenLabs free tier](https://elevenlabs.io/pricing) ~10 min/mo for a polished AI VO.)*

## 3 · Render the MP4
```bash
# set "durationInSeconds" in video/remotion/props.json to your capture length, then:
cd video/remotion
npm install
npm run render                        # → video/remotion/out/demo.mp4  (1920×1080, 30fps, H.264)
# preview/tweak live instead:  npm run studio   (adjust captions in src/captions.ts)
```

## What you can edit
- `src/captions.ts` — the lower-third caption text + timing (nudge `fromSec` to hit each beat).
- `src/MeridianDemo.tsx` — intro/outro cards, watermark, layout.
- `video/narration.txt` — the voiceover copy.
- `../SCRIPT.md` — the full 3-minute narration if you record your own voice (Option B).

## Alternative methods (from research)
| Method | Cost | Effort | Look |
|---|---|---|---|
| **This pipeline** (Playwright + Remotion) | Free | Low, hands-off | Produced, code-driven |
| Your voice + Remotion | Free | Medium | Most authentic |
| Screen Studio | ~$9 | Low | Auto-zoom cinematic |
| Cmd+Shift+5 + Descript | Free | Low | Simple, auto-captions |
