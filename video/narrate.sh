#!/usr/bin/env bash
# Generate a voiceover from narration.txt using macOS built-in TTS (free, offline).
# → video/remotion/public/vo.wav   (then render with withVoiceover:true)
#
# Tip: add a premium voice in System Settings → Accessibility → Spoken Content → System Voice,
# then pass it: ./narrate.sh "Ava (Premium)"
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/remotion/public"
VOICE="${1:-Samantha}"
mkdir -p "$OUT"
echo "Generating voiceover with voice: $VOICE"
say -v "$VOICE" -o "$OUT/vo.aiff" -f "$DIR/narration.txt"
afconvert "$OUT/vo.aiff" "$OUT/vo.wav" -d LEI16 -f WAVE
rm -f "$OUT/vo.aiff"
echo "→ $OUT/vo.wav   (set \"withVoiceover\": true in video/remotion/props.json)"
