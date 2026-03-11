

# Replace Robots with 5 Animated Music Characters

## What
Remove the current 4 robot pose images and replace them with the user's 5 uploaded JumTunes characters. Each character performs for ~10 seconds with a unique animation style (sway, bounce, head-bob, lean, pulse) before cross-fading to the next one in a random order. The characters appear as semi-transparent background performers on every page.

## Characters
1. **Robot DJ** (IMG_5026) -- helmet bot with mic, aggressive head-bob + scale pulse
2. **Male Singer** (IMG_5025) -- smooth sway side-to-side + subtle float
3. **Female Singer** (IMG_5024) -- flowing lean + gentle rotation
4. **Braids Singer** (IMG_5023) -- rhythmic bounce + slight tilt
5. **Blonde DJ** (IMG_5022) -- energetic lean-forward + bounce

## How

### 1. Copy uploaded images to `src/assets/`
Copy all 5 user-uploaded PNGs as:
- `src/assets/char-robot-dj.png`
- `src/assets/char-male-singer.png`
- `src/assets/char-female-singer.png`
- `src/assets/char-braids-singer.png`
- `src/assets/char-blonde-dj.png`

### 2. Delete old robot assets
Remove the 4 old `robot-pose-*.png` files from `src/assets/`.

### 3. Rewrite `RobotPerformer.tsx` -> `CharacterPerformer.tsx`
- Import all 5 character images
- Define a `characters` array, each entry having: `src`, `animationClass` (unique CSS class)
- Use a **10-second `setInterval`** instead of scroll-based pose swapping
- On each tick: fade out (300ms), randomly pick a different character, apply its unique animation class, fade in
- Keep `position: fixed`, `pointer-events: none`, `hidden md:block`, low opacity (~0.2)
- Each character gets a unique CSS animation class applied to the `<img>` element

### 4. Add 5 unique character animation keyframes in `src/index.css`
Each character gets a distinct movement signature:

| Character | Animation Name | Movement |
|-----------|---------------|----------|
| Robot DJ | `char-headbob` | Aggressive Y bounce + scale pulse (0.95-1.05) |
| Male Singer | `char-sway` | Smooth X translation left-right + gentle float |
| Female Singer | `char-lean` | Slight rotateZ (-3deg to 3deg) + translateY float |
| Braids Singer | `char-bounce` | Quick Y bounce + subtle rotateY tilt |
| Blonde DJ | `char-rock` | Forward lean (rotateX) + energetic scale bounce |

All animations: 2-4 second cycles, GPU-accelerated (`transform` only), combined with the existing `robot-glow-pulse` aura.

### 5. Update Layout.tsx
- Change import from `RobotPerformer` to `CharacterPerformer`
- Render `<CharacterPerformer />` in the same position

### 6. Clean up old robot CSS
Remove `robot-float` and `robot-rotate` keyframes from `index.css` (replaced by the 5 new character animations). Keep `robot-glow-pulse` (renamed to `performer-glow-pulse`).

## Files

| File | Change |
|------|--------|
| `src/assets/char-*.png` | 5 new character images (copied from uploads) |
| `src/assets/robot-pose-*.png` | Delete all 4 |
| `src/components/effects/RobotPerformer.tsx` | Rewrite as `CharacterPerformer.tsx` with timer-based rotation + per-character animation classes |
| `src/index.css` | Replace robot keyframes with 5 unique character animation keyframes |
| `src/components/layout/Layout.tsx` | Update import to `CharacterPerformer` |

## Performance
- Still just 1 `<img>` + 1 glow div in the DOM at any time
- Pure CSS animations, no JS animation loops
- Only a single `setInterval` (10s) for character swapping
- Hidden on mobile, respects `prefers-reduced-motion`

