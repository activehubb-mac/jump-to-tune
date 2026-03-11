

# Mind-Blowing Animated Background Overhaul

## Current State
The background is a static repeating tile image (`music-pattern-bg.jpg`) with flat particles floating on top. It's functional but plain.

## Plan: Multi-Layer Animated Background

Replace the current setup with a **layered, animated cosmic background** using pure CSS — no libraries needed, zero performance cost from JS.

### Layer 1: Animated Gradient Mesh (replaces static tile)
Replace the static `background-image` tile with a large animated **radial gradient mesh** — multiple radial gradients at different positions that slowly drift around, creating a living, breathing aurora effect.

```
body background:
  radial-gradient(ellipse at 20% 50%, primary/12, transparent 50%),
  radial-gradient(ellipse at 80% 20%, accent/10, transparent 50%),
  radial-gradient(ellipse at 50% 80%, primary/8, transparent 40%)
```

These positions animate via `background-position` over 30s, creating a slow-moving nebula effect behind all content.

### Layer 2: Noise Texture Overlay
Add a subtle CSS noise grain overlay on the `<body>` using a tiny inline SVG `filter: url(#noise)` — gives the gradients a filmic, tactile quality instead of looking like smooth digital blobs.

### Layer 3: Enhanced ParticleBackground
Upgrade the existing `ParticleBackground` component:
- Add a new particle shape: **"star"** — 4-pointed CSS stars using clip-path
- Add a new particle shape: **"streak"** — thin elongated lines that move diagonally (like shooting stars)
- Add 3 **large nebula orbs** (50-100px) with heavy blur that drift independently on a slower cycle
- Increase glow particle `boxShadow` intensity for more visible light spots

### Layer 4: Horizon Light Line
Add a subtle horizontal light streak across the middle of the viewport — a thin gradient line that pulses in opacity, like a distant horizon or soundwave baseline.

### Files

| File | Change |
|------|--------|
| `src/index.css` | Replace static body bg with animated gradient mesh + noise SVG filter + horizon-line keyframes + shooting-star keyframes |
| `src/components/effects/ParticleBackground.tsx` | Add star/streak shapes, add 3 large nebula orbs, boost glow intensity |

### Performance
- All CSS-only animations (GPU-accelerated `transform` and `opacity`)
- Particles stay at 50 DOM elements (desktop)
- Nebula orbs add only 3 more elements
- Noise filter is a single SVG element
- `prefers-reduced-motion` disables all motion

