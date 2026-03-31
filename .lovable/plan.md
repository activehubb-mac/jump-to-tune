

## Add Voiceover Audio to 4K Demo Video

### Problem
The 4K demo video has `muted: true` in the render script, which kills all audio output. The uploaded avatar video is correctly muted via `volume={0}`, but there's no voiceover audio for the captions — only visual text overlays exist. The user wants to hear the narration: *"Welcome to JumTunes — the first AI music platform..."*

### Solution

1. **Generate voiceover** for the demo caption script using ElevenLabs TTS (the key is already connected). Script:
   > "Welcome to JumTunes. The first AI music platform where creators turn ideas into real music, visuals, and income in seconds. Create. Share. Get paid. This is the future of music."

   Save to `remotion/public/voiceover/demo-narration.mp3`

2. **Add `<Audio>` component** to `MainVideo.tsx` playing `demo-narration.mp3` at full volume

3. **Update render script** — change `muted: true` to `muted: false` for the `main` composition only. Since the sandbox ffmpeg may lack AAC, we'll render silent first then mux audio with ffmpeg as we did for the tour video.

4. **Re-render** to `/mnt/documents/jumtunes-demo-v4.mp4`

### Files Changed

| File | Change |
|---|---|
| `remotion/public/voiceover/demo-narration.mp3` | New — ElevenLabs voiceover |
| `remotion/src/MainVideo.tsx` | Add `<Audio src={staticFile("voiceover/demo-narration.mp3")} />` |
| `remotion/scripts/render-remotion.mjs` | Keep `muted: true` for rendering, then mux audio via ffmpeg post-render |

