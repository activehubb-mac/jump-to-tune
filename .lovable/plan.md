

# Plan: Update Hover Overlay to Dark Charcoal

## The Issue
Currently the track card hover overlay uses `bg-background/80` which on the smoke-gray light theme results in a light/white overlay. This doesn't look as polished and creates less contrast for the action buttons.

## Solution
Change the hover overlay from light background to a dark charcoal color with opacity. This will:
- Create a more premium, Spotify-like appearance
- Provide better contrast for the white play button icons
- Give a "darkroom" effect that draws attention to the cover art and actions

## Visual Comparison

```text
BEFORE (current):                    AFTER (proposed):
┌─────────────────┐                 ┌─────────────────┐
│  Cover Art      │                 │  Cover Art      │
│   ┌─────────┐   │                 │   ┌─────────┐   │
│   │ White   │   │   ──────►       │   │ Dark    │   │
│   │ Overlay │   │                 │   │ Overlay │   │
│   │   ▶️     │   │                 │   │   ▶️     │   │
│   └─────────┘   │                 │   └─────────┘   │
└─────────────────┘                 └─────────────────┘
  bg-background/80                    bg-[#1a1a1a]/80
  (light gray)                        (charcoal)
```

## Files to Update

### 1. `src/components/dashboard/TrackCard.tsx` (Line 204)

**Current:**
```tsx
<div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
```

**Updated:**
```tsx
<div className="absolute inset-0 bg-[#1a1a1a]/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
```

Using `#1a1a1a` (a near-black charcoal) at 80% opacity creates a dark, sophisticated overlay that matches premium music apps.

### 2. `src/components/browse/SearchResultsView.tsx`

Apply the same dark overlay pattern to any track cards in search results that have hover overlays.

## Technical Details

- **Color choice**: `#1a1a1a` is a deep charcoal (almost black) that works well for overlays
- **Opacity**: 80% provides enough darkness to make white icons pop while still showing the cover art beneath
- **No theme variable needed**: Using a fixed hex color ensures the overlay is always dark regardless of theme settings

## Benefits
- Premium, polished appearance matching Spotify/Apple Music
- Better button visibility with white icons on dark overlay
- Creates visual focus on the action buttons
- Consistent dark overlay across all track card instances

