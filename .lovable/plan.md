

# Add Motion to Cards + Karaoke Banner Overhaul

## 1. Subtle repeating motion on all artwork cards

Add a slow Ken Burns-style animation (gentle zoom + pan) to the background images on all 11 cards. This creates a living, breathing feel without being distracting.

**CSS keyframes to add in `src/index.css`**:
- `card-drift`: slow 20s infinite alternate — scales from 1.0 to 1.08 and translates slightly, creating a subtle parallax drift effect

**Files affected**:
- `src/index.css` — add `card-drift` keyframe + `.animate-card-drift` utility
- `src/components/home/CreateWithAISection.tsx` — apply `animate-card-drift` to the `<img>` elements
- `src/components/home/FanZoneSection.tsx` — apply `animate-card-drift` to fan card `<img>` elements  
- `src/pages/Index.tsx` — apply `animate-card-drift` to the 6 feature/CTA card `<img>` elements

## 2. Karaoke Promo Banner — futuristic 3D motion overhaul

Transform the flat `KaraokePromoBanner` into a visually alive, futuristic section with:

- **Animated 3D background**: Generate a realistic 3D image (futuristic karaoke stage with holographic waveforms) and apply the same `card-drift` animation
- **Animated sound wave bars**: CSS-only equalizer bars (5-7 bars with staggered `animation-delay`) using a simple `equalizer-bar` keyframe that scales Y
- **Floating particle orbs**: 3-4 small glowing circles with different `animation-duration` floating animations (reuse `particle-float` from existing CSS)
- **Pulsing ring around mic icon**: Add a repeating scale+fade ring animation behind the mic circle
- **Gradient sweep**: A diagonal gradient that slowly moves across the card using `background-position` animation

**Files affected**:
- `src/index.css` — add `equalizer-bar`, `pulse-ring`, `gradient-sweep` keyframes
- `src/components/home/KaraokePromoBanner.tsx` — complete visual overhaul with animated elements + 3D background image
- Generate 1 new asset: `src/assets/karaoke-banner-bg.jpg` — futuristic 3D karaoke stage render

### Karaoke Banner structure:
```
[Banner Container - glass-card-bordered, overflow-hidden]
  ├── 3D Background image (animate-card-drift, opacity-50)
  ├── Gradient overlay (from-background/80)
  ├── Animated gradient sweep layer
  ├── Floating particle orbs (3-4, staggered particle-float)
  ├── Equalizer bars (right side, 7 bars, staggered animation)
  ├── Pulsing ring behind mic icon
  ├── Content (badge, title, description, CTA button)
  └── Floating music note icons (existing, keep)
```

All animations respect `prefers-reduced-motion: reduce`.

