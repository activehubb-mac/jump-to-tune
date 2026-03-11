

# Add "Pop Out" 3D Hover Effect to Track Cards

## What
When hovering over any music track card, the card will dramatically lift toward the viewer with a 3D perspective transform — scaling up, rising with a shadow, and tilting slightly. This creates an immersive "popping out of the screen" effect.

## How

### 1. Add new CSS utilities in `src/index.css`

Add a `.track-card-3d` utility class that applies:
- `perspective(800px)` on the parent container
- On hover: `scale(1.08) translateY(-8px) translateZ(20px)` with a `rotateX(2deg)` tilt
- Large layered box-shadow on hover for depth (primary glow + deep shadow)
- Smooth 400ms cubic-bezier transition for a springy feel
- A subtle inner glow border effect on hover

### 2. Apply to `TrackCard.tsx` (line 155)
Change the outer div class to include the 3D transform:
- Add `track-card-3d` class
- Keep existing `glass-card p-4 group cursor-pointer` classes

### 3. Apply to `SpotifyTrackCard.tsx` (line 45)
Add the same `track-card-3d` class to the outer container div.

### 4. Apply to `OwnedTrackCard.tsx` (line 53)
Add `track-card-3d` to the outer container.

### 5. Apply to `AlbumCard.tsx`
Add `track-card-3d` to the album card container for consistency.

### CSS Definition
```css
.track-card-3d {
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.4s ease;
}
.track-card-3d:hover {
  transform: scale(1.08) translateY(-12px) rotateX(2deg);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4),
              0 0 30px hsl(var(--primary) / 0.2);
  z-index: 20;
}
```

The cubic-bezier `(0.34, 1.56, 0.64, 1)` creates a spring overshoot — the card overshoots slightly then settles, giving that "popping toward you" punch. Respects `prefers-reduced-motion`.

### Files
| File | Change |
|------|--------|
| `src/index.css` | Add `.track-card-3d` utility with 3D hover transform |
| `src/components/dashboard/TrackCard.tsx` | Add `track-card-3d` class |
| `src/components/browse/SpotifyTrackCard.tsx` | Add `track-card-3d` class |
| `src/components/library/OwnedTrackCard.tsx` | Add `track-card-3d` class |
| `src/components/browse/AlbumCard.tsx` | Add `track-card-3d` class |

