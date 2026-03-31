

## 4K Demo Ad Video — "Build My Artist" Flow

### What We're Building
A 30-second, 9:16 vertical (2160×3840), dark luxury cinematic demo video rendered via Remotion. It walks through the Build My Artist journey: creating an avatar → uploading a track → generating cover art → generating a video — all presented as if happening in real-time within JumTunes.

### Creative Direction

**Movement: "Silent Studio Cinema"**
- Dark backgrounds (#141414), soft gold (#B8A675) accents, warm charcoal (#6B6560) secondary
- Slow reveals, dramatic scale shifts, parallax depth
- Gold light leaks and subtle grain texture
- Typography: Inter (clean body) + Playfair Display (editorial headlines)

**Motion system:**
- Elements enter via scale-up from 0.95 + fade (smooth spring, damping: 200)
- Scene transitions: wipe or cross-fade via `@remotion/transitions`
- Accent moments: spring with slight overshoot (damping: 15)
- Persistent floating gold particles throughout

### Scene Breakdown (30s @ 30fps = 900 frames)

| Scene | Frames | Content |
|---|---|---|
| 1. Hook | 0–120 | Dark void → gold particle burst → "Build Your Artist" title fades in with JumTunes wordmark |
| 2. Avatar Creation | 120–330 | AI-generated avatar photo scales in like it's being created. Simulated UI frame around it. "Create Your Identity" text |
| 3. Upload Track | 330–480 | Waveform animation draws across screen. Track title + artist name appear. "Upload Your Music" |
| 4. Cover Art | 480–660 | AI-generated cover art reveals with a cinematic unblur effect. "Generate Cover Art" |
| 5. Video Generation | 660–810 | Simulated video frames cascade/flip. "Create Your Video" |
| 6. Closing | 810–900 | All assets compose into a final artist profile card. JumTunes logo. Gold shimmer. |

### Asset Generation (Pre-render step)
Before building the Remotion project, I'll use the AI image generation skill to create:
1. **Avatar photo** — stylized artist portrait, dark/moody lighting
2. **Cover art** — album artwork matching JumTunes aesthetic
3. **UI mockup elements** — simulated phone frames / UI chrome (built in code as SVG/CSS)

### Technical Setup

**Project structure:**
```
remotion/
  src/
    index.ts
    Root.tsx
    MainVideo.tsx
    scenes/
      HookScene.tsx
      AvatarScene.tsx
      UploadScene.tsx
      CoverArtScene.tsx
      VideoGenScene.tsx
      ClosingScene.tsx
    components/
      GoldParticles.tsx
      PhoneFrame.tsx
      WaveformAnimation.tsx
  public/
    images/
      avatar.png
      cover-art.png
  scripts/
    render-remotion.mjs
```

**Composition:** 2160×3840, 30fps, 900 frames, codec h264, CRF 18 for quality.

### Rendering
Programmatic render via `scripts/render-remotion.mjs` to `/mnt/documents/jumtunes-demo.mp4`.

### Steps
1. Generate avatar + cover art images via AI gateway
2. Scaffold Remotion project with all scenes
3. Build persistent layers (gold particles, grain overlay)
4. Build 6 scenes with staggered animations
5. Wire with TransitionSeries
6. Spot-check key frames
7. Render final 4K MP4

### Files Changed

| Location | Change |
|---|---|
| `remotion/` (new directory) | Full Remotion project with 6 scenes |
| `/mnt/documents/jumtunes-demo.mp4` | Final rendered 4K video output |

No changes to the JumTunes app codebase.

