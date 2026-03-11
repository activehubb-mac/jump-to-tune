

# Animated AI Music Robot Background Character

## What
Add a floating, semi-transparent AI music robot character that hovers in the background, performing different motions (singing, dancing, headbanging, pointing mic) as users scroll. The robot follows the scroll position and cycles through unpredictable animation states.

## Approach

Since this is a React/Vite project (no Next.js, no native 3D engine), the best approach is:

1. **Generate a set of robot pose images** using AI image generation — 4-5 different poses of a futuristic glowing AI music robot holding a microphone (transparent/dark background)
2. **Build a `RobotPerformer` component** that:
   - Tracks scroll position via `useEffect` + `scroll` event
   - Rotates through poses based on scroll thresholds (every ~400px of scroll triggers a new pose)
   - Applies CSS transforms: slow rotation (`rotateY`), floating bob (`translateY`), and slight scale pulses
   - Uses `position: fixed` with low opacity (~0.15-0.25) so it's atmospheric, not distracting
   - Moves vertically to loosely follow the viewport scroll
   - Randomly picks the next pose (not sequential) for unpredictability

### Robot Poses (AI-generated images)
Generate 4 images of the same futuristic robot character:
1. **Singing** — mouth open, mic close, head tilted back
2. **Dancing** — arms out, leaning to one side
3. **Headbanging** — head down, hair/cables flying
4. **Pointing mic** — arm extended toward viewer

### Animation Layers
- **Float bob**: `translateY` oscillation (CSS keyframe, 6s cycle)
- **Slow rotation**: `rotateY` 0→360° (CSS keyframe, 20s cycle)
- **Glow pulse**: `drop-shadow` intensity pulsing (CSS keyframe, 4s cycle)
- **Scroll-driven position**: JS updates `top` position to follow scroll
- **Pose swap**: JS swaps `src` on scroll thresholds with a quick fade transition

### Component Structure
```
<RobotPerformer />  (fixed position, z-index: 2, pointer-events: none)
  ├── Glow aura div (blurred radial gradient behind robot)
  └── <img> (current pose, with CSS transitions for opacity crossfade)
```

### Files

| File | Change |
|------|--------|
| `src/assets/robot-pose-*.png` | 4 AI-generated robot pose images |
| `src/components/effects/RobotPerformer.tsx` | New component — scroll-tracking animated robot |
| `src/index.css` | Add `robot-float`, `robot-rotate`, `robot-glow` keyframes |
| `src/components/layout/Layout.tsx` | Import and render `<RobotPerformer />` alongside `<ParticleBackground />` |

### Performance
- Only 1 DOM element (image) + 1 glow div — minimal overhead
- Scroll listener throttled with `requestAnimationFrame`
- Images are static PNGs, no canvas or WebGL
- Hidden on mobile (`hidden md:block`) to save resources
- Respects `prefers-reduced-motion`

