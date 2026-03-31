

## Remake Demo Video — Talking Avatar with Voiceover

### What's Changing

The current video uses generic placeholder assets, text-only titles, and no audio. The new version will:

1. Use the **user's uploaded avatar** (`0F43E362...PNG`) as the performing artist throughout
2. Use the **real JumTunes logo** (`jumtunes-logo-test.png`)
3. Add **ElevenLabs voiceover** narrating the provided script
4. Show the avatar **"performing"** — with lip-sync-simulated motion, Ken Burns zoom, rhythmic pulses, and equalizer bars
5. Display **captions** synced to the voiceover so viewers can read along

### Voiceover Script

> "Welcome to JumTunes — the first AI music platform where creators turn ideas into real music, visuals, and income in seconds. Create. Share. Get paid. This is the future of music."

Generated via ElevenLabs API (voice: "Brian" or similar deep cinematic male voice), saved to `remotion/public/voiceover/narration.mp3`. Audio plays throughout. The `muted: true` flag in the render script will be changed to `muted: false` — if the sandbox ffmpeg lacks AAC, we'll use `audioCodec: "pcm-16bit"` or post-process with ffmpeg to mux.

### Scene Breakdown (30s @ 30fps = 900 frames)

| # | Scene | Frames | VO Segment | Visual |
|---|---|---|---|---|
| 1 | Logo Intro | 0–90 | "Welcome to JumTunes" | Real JumTunes logo (`jumtunes-logo-test.png`) scales in with gold flash |
| 2 | Platform Reveal | 90–270 | "...the first AI music platform where creators turn ideas into real music, visuals, and income in seconds" | Avatar shown full-screen with simulated JumTunes UI navbar. Ken Burns zoom, subtle head-bob drift, rhythmic scale pulse. Equalizer bars at bottom. |
| 3 | Feature Montage | 270–540 | "Create. Share. Get paid." | Three quick beats — each word triggers a visual: (1) Avatar creating/generating, (2) Cover art reveal, (3) Gold coin/earnings animation. Punchy 90-frame segments. |
| 4 | Avatar Performance | 540–780 | (instrumental beat / silence) | Full avatar performance scene — avatar fills frame with cinematic zoom, heavy equalizer, particle burst, track title overlay "Midnight Empire" |
| 5 | Closing | 780–900 | "This is the future of music." | Avatar shrinks into profile card, stats appear, real JumTunes logo at bottom with tagline |

### Avatar "Performing" Effect

The uploaded AI avatar (static image) will be animated to simulate performance:
- **Ken Burns zoom**: Scale from 1.0 → 1.08 over scene duration
- **Head bob**: `translateY(Math.sin(frame * 0.15) * 12)`
- **Beat pulse**: `scale(1 + Math.sin(frame * 0.3) * 0.02)` — rhythmic breathing
- **Slight rotation drift**: `rotate(Math.sin(frame * 0.08) * 1.5)deg`
- **Equalizer overlay**: 16 animated bars at bottom driven by `Math.sin(frame * speed + offset)`
- **Vignette**: Dark gradient overlay from edges for cinematic depth
- **Gold light leak**: Pulsing radial gradient behind avatar

### Captions

Captions will be rendered as styled text overlays synced to the voiceover timing. Each phrase appears/disappears in sync with the narration. Gold text on dark semi-transparent background strip at bottom of frame.

### Technical Steps

1. **Copy assets**: Upload the user's avatar PNG and JumTunes logo into `remotion/public/images/`
2. **Generate voiceover**: Use ElevenLabs API via a script (`remotion/scripts/generate-voiceover.mjs`) to create `remotion/public/voiceover/narration.mp3`
3. **Rewrite all 5 scenes** with new content as described above
4. **Add CaptionOverlay component**: A persistent layer that shows caption text synced to frame ranges
5. **Update MainVideo.tsx**: New 5-scene structure with `<Audio>` component for voiceover
6. **Update Root.tsx**: Keep 2160×3840, 900 frames, 30fps
7. **Update render script**: Remove `muted: true`, add audio codec handling
8. **Render**: Output to `/mnt/documents/jumtunes-demo-v2.mp4`

### Files Changed

| File | Change |
|---|---|
| `remotion/public/images/ai-avatar.png` | User's uploaded avatar |
| `remotion/public/images/jumtunes-logo.png` | Real logo from `public/images/jumtunes-logo-test.png` |
| `remotion/public/voiceover/narration.mp3` | Generated ElevenLabs voiceover |
| `remotion/scripts/generate-voiceover.mjs` | New — TTS generation script |
| `remotion/src/scenes/HookScene.tsx` | Rewrite — real logo intro |
| `remotion/src/scenes/AvatarScene.tsx` | Rewrite — avatar performance with UI chrome |
| `remotion/src/scenes/UploadScene.tsx` | Rewrite → FeatureMontageScene (Create/Share/GetPaid) |
| `remotion/src/scenes/CoverArtScene.tsx` | Rewrite → PerformanceScene (full avatar performance) |
| `remotion/src/scenes/VideoGenScene.tsx` | Remove |
| `remotion/src/scenes/ClosingScene.tsx` | Rewrite — profile card with real logo |
| `remotion/src/components/CaptionOverlay.tsx` | New — synced caption text |
| `remotion/src/components/EqualizerBars.tsx` | New — animated equalizer |
| `remotion/src/MainVideo.tsx` | New scene structure + Audio + CaptionOverlay |
| `remotion/scripts/render-remotion.mjs` | Remove `muted: true` |

### Not Touched
App codebase — no changes to JumTunes platform code.

