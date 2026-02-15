

# Fullscreen Track Player

## Summary

Add a fullscreen player view that opens when users tap the mini player bar. Inspired by the Spotify reference screenshots, this creates an immersive listening experience with a large cover art display, full playback controls, and quick-access action menus -- all styled with the Silent Studio dark charcoal (#141414) background so the cover art pops.

---

## How It Works

**Opening:** Tapping anywhere on the mini player bar (except specific buttons like play/pause, skip, close) expands it into a fullscreen overlay.

**Closing:** Tapping the chevron-down arrow at the top collapses it back to the mini player bar.

**Layout (top to bottom):**

1. **Header bar** -- Chevron down (close) on the left, source label in center (e.g., album/playlist name if available), "..." menu on the right
2. **Cover art** -- Large, centered, with rounded corners and subtle shadow to make it pop against the dark background
3. **Track info** -- Title (bold, large) and artist name (tappable, links to artist profile)
4. **Progress bar** -- Slider with current time on left and remaining/total time on right, preview limit marker if applicable
5. **Playback controls** -- Shuffle, Previous, Play/Pause (large circle), Next, Repeat
6. **Action row** -- Like/Credits icon, Add to Playlist, Download, Queue toggle
7. **Scrollable area below** (optional scroll) -- View Credits section (reuses the same categorized layout already built)

**"..." Menu (bottom sheet):**
- Add to Playlist
- Go to Artist
- Go to Album (if track has album_id)
- View Credits
- Download
- Share (copy link)

---

## Background Color Decision

Using the app's existing **dark charcoal (#141414)** as a solid background rather than dynamic dominant color extraction. Reasons:
- Consistent with the Silent Studio theme
- Cover art naturally pops against the dark background
- No external color extraction library needed
- Gold (#B8A675) accent color for the progress bar and active controls provides cohesion

---

## Modal Conflict Handling

- Opening the fullscreen player **closes** the queue panel and credits sheet if open
- The fullscreen player lives at **z-[55]** (above the mini player at z-50, below credits sheet at z-[60])
- The "..." action menu uses a Drawer at z-[60]
- Queue can be re-opened from within the fullscreen view (overlays on top)
- Credits sheet can be opened from within fullscreen (overlays on top)

---

## Technical Details

### New File: `src/components/audio/FullscreenPlayer.tsx`

A new component that receives all player state and actions as props from GlobalAudioPlayer. It renders:
- Full viewport overlay with `fixed inset-0` positioning
- Background: solid `bg-[#141414]` with safe area insets
- Animated entrance/exit using framer-motion (slide up/down)
- Cover art with `aspect-square` sizing, max width ~320px on mobile, ~400px on desktop
- All existing player controls (shuffle, prev, play, next, repeat) in the same layout
- Progress slider (reuses existing Slider component)
- Action row buttons
- "..." menu using the existing Drawer component for bottom sheet actions
- ScrollArea for credits content at the bottom (lazy-loaded, same queries as TrackCreditsSheet)

### Modified File: `src/components/audio/GlobalAudioPlayer.tsx`

- Add `showFullscreen` boolean state
- Clicking the player bar (track info area / cover art on mobile) sets `showFullscreen = true` and closes queue
- The existing cover art `onClick` currently opens credits -- this changes to open fullscreen instead; credits access moves into the fullscreen view
- Render `<FullscreenPlayer>` conditionally when `showFullscreen` is true
- Pass all necessary state and handlers as props

### Props Interface for FullscreenPlayer

```text
- currentTrack, isPlaying, isBuffering, currentTime, duration, volume, isMuted
- isPreviewMode, previewTimeRemaining, currentPreviewLimit
- isShuffled, repeatMode, hasKaraoke, isKaraokeMode, showLyrics
- hasNext, hasPrevious, needsUserGesture
- All handler functions: togglePlayPause, seek, playNext, playPrevious, etc.
- onClose: () => void (collapses back to mini player)
- onOpenQueue: () => void
- onOpenCredits: (track) => void
```

### Safe Area Handling

- Top: `padding-top: env(safe-area-inset-top)` for the header
- Bottom: `padding-bottom: env(safe-area-inset-bottom)` for the action row
- Follows existing iOS hardening patterns

### No Database Changes

All data is already available. Credits reuse existing queries.

