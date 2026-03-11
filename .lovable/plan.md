

## Add Realistic Energy Effects to Cards

### What We're Building
A living, breathing energy effect on all cards — subtle animated border glow that pulses like electrical current flowing around the card edges, plus a faint inner energy shimmer. This gives cards a "powered on" feeling without being distracting.

### Approach

**1. CSS Keyframes & Utility Classes** (`src/index.css`)

Add three new effects:

- **`energy-border`**: An animated gradient border that rotates around the card using a `conic-gradient` behind the card (pseudo-element technique). Creates a realistic energy flow along card edges — gold to copper cycling.
- **`energy-shimmer`**: A subtle light sweep that moves across the card surface periodically, like a reflection of energy passing through.
- **`energy-pulse`**: A faint outer glow that breathes in and out, simulating radiated energy.

**2. Apply to Card Base Classes** (`src/index.css`)

Update `.glass-card` and `.glass-card-bordered` to include the energy pulse glow and shimmer by default, keeping it subtle (low opacity).

**3. Update Card Component** (`src/components/ui/card.tsx`)

No structural changes needed — effects flow through the existing CSS utility classes.

**4. Enhanced Track/Store Cards**

Update `SpotifyTrackCard`, `StoreProductCard`, and `TrackCard` to use the energy border effect on hover for a more dramatic "selected/active" feel.

### Technical Detail

The rotating border effect uses a `@property` registered CSS custom property for the angle, animated via `@keyframes`. The shimmer uses a moving linear-gradient overlay. Both respect `prefers-reduced-motion`.

```text
Card anatomy:
┌─────────────────────────┐
│ ░░ energy-border ░░░░░░ │  ← rotating conic-gradient border (hover)
│ ┌─────────────────────┐ │
│ │  shimmer sweep →→→  │ │  ← periodic light sweep across surface
│ │                     │ │
│ │   card content      │ │
│ │                     │ │
│ └─────────────────────┘ │
│ ╰── energy-pulse glow ──╯│  ← breathing outer shadow
└─────────────────────────┘
```

### Files to Edit
- `src/index.css` — Add energy keyframes, shimmer, and pulse classes
- `src/components/browse/SpotifyTrackCard.tsx` — Add energy classes
- `src/components/store/StoreProductCard.tsx` — Add energy classes  
- `src/components/dashboard/TrackCard.tsx` — Add energy classes
- `src/components/artist/AnnouncementCard.tsx` — Add energy classes

