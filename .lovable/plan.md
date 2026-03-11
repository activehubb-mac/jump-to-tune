

## Plan: Replace 5 Static Character Images with Animated Video Performers

### What's changing
Replace the 5 PNG character images (`character-robot.png`, `character-singer-male.png`, etc.) in the floating background with the 5 uploaded performer videos, creating a more dynamic, realistic background effect.

### Steps

1. **Copy the 5 uploaded videos** to `public/videos/` with clear names:
   - `performer-1.mp4`, `performer-2.mp4`, `performer-3.mp4`, `performer-4.mp4`, `performer-5.mp4`

2. **Update `src/components/effects/ParticleBackground.tsx`**:
   - Change the `CHARACTERS` array to reference the new video paths
   - Replace the `<img>` tags in the floating characters section with `<video>` tags using `autoPlay`, `loop`, `muted`, `playsInline` attributes
   - Keep the same orbit animation, sizing, and opacity logic
   - Add `object-contain` styling and remove poster/controls for seamless background playback
   - Since the videos have plain black backgrounds, they'll blend naturally with the dark cosmic theme

### Files modified
- `src/components/effects/ParticleBackground.tsx`
- 5 new files copied to `public/videos/`

