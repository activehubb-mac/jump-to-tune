

## Update 4K Demo Video — Replace Avatar Performance with Uploaded Video

### What Changes

Replace the static avatar image animation in `CoverArtScene.tsx` (the "Performance" scene) with the uploaded `Firefly-Video.mp4`, played muted. The video will fill the performance scene with the same cinematic overlays (vignette, equalizer, track title).

### Steps

1. **Copy uploaded video** to `remotion/public/videos/avatar-performance.mp4`

2. **Re-register the `main` composition** in `Root.tsx` — it was removed when the tour video was added. Register both compositions:
   - `main`: 2160×3840, 900 frames, 30fps (the 4K demo)
   - `tour`: 1920×1080, 2400 frames, 30fps (existing tour)

3. **Rewrite `CoverArtScene.tsx`** — replace `<Img>` with `<Video>`:
   - Use `<Video src={staticFile("videos/avatar-performance.mp4")} volume={0} />` (muted)
   - Keep all existing cinematic overlays: vignette, gold light leak, equalizer bars, track title, top/bottom gradient bars
   - Keep Ken Burns zoom via CSS transform on a wrapper div
   - Remove head-bob/beat-pulse/rotation (real video has its own motion)

4. **Update render script** to accept composition ID arg (already does) and render `main` composition to `/mnt/documents/jumtunes-demo-v3.mp4`

5. **Render** the updated 4K demo video

### Files Changed

| File | Change |
|---|---|
| `remotion/public/videos/avatar-performance.mp4` | New — copied from uploaded video |
| `remotion/src/Root.tsx` | Re-add `main` composition (2160×3840, 900 frames) alongside `tour` |
| `remotion/src/scenes/CoverArtScene.tsx` | Replace `<Img>` with muted `<Video>`, keep overlays |
| `remotion/scripts/render-remotion.mjs` | Render `main` to `jumtunes-demo-v3.mp4` |

### Not Touched
- Tour video, app codebase, other scenes, captions, particles

