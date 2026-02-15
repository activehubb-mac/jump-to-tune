

# Fix Fullscreen Player: Click Area, Scroll, and Content Sections

## Problems Identified

1. **Clicking empty space in the player bar does nothing** -- only the cover art and track title are wired to open fullscreen. The entire left section of the bar should be tappable.
2. **Background scrolls instead of fullscreen player content** -- the fullscreen overlay uses `overflow-hidden` with no scrollable inner container, so swipe gestures leak through to the page behind it.
3. **Missing content below controls** -- the Spotify reference shows that scrolling down reveals additional sections: "More from this artist" (their other tracks), "Artist info" section, and inline credits. Currently the fullscreen player is static with no scrollable content.

---

## What Will Change

### 1. Fix Player Bar Click Area (GlobalAudioPlayer.tsx)

Wrap the entire player bar `div` (the bottom fixed bar) with an `onClick` handler so tapping anywhere on it (except interactive buttons like play/pause, skip, close, volume) opens the fullscreen player. This will use `event.target` checks or wrap the non-button area in a clickable container.

**Approach:** Add an `onClick` on the outer player bar div that opens fullscreen, then add `e.stopPropagation()` on all interactive buttons (play, skip, close, volume, etc.) so they don't also trigger the fullscreen open.

### 2. Fix Scroll Behavior (FullscreenPlayer.tsx)

Restructure the fullscreen player layout:
- The outer `motion.div` keeps `overflow-hidden` and `touch-action: none` on the background to prevent page scrolling
- Add `overscrollBehavior: 'contain'` to trap scroll within the player
- The inner content becomes a scrollable container that holds the cover art, controls at the top (fixed/sticky), and scrollable content sections below

**Layout structure:**
```text
[Fixed overlay - covers full screen, traps scroll]
  [Header bar - flex-shrink-0, always visible]
  [Scrollable content area - overflow-y: auto]
    [Cover art - large, centered]
    [Track info]
    [Progress bar]
    [Playback controls]
    [Action row]
    [--- Scrollable extra content below ---]
    [More from this Artist - horizontal card carousel]
    [Credits section - categorized, inline]
    [About the Artist - mini bio card with link]
  [/Scrollable content area]
[/Fixed overlay]
```

### 3. Add Scrollable Content Sections (FullscreenPlayer.tsx)

Below the action row, add three new sections that the user can scroll to:

**a) "More from this Artist" section**
- Fetches other tracks by the same artist (using `artist.id`) from the `tracks` table
- Excludes the currently playing track
- Displays as a horizontal scrollable row of small track cards (cover art + title)
- Tapping a card plays that track (calls `playTrack` from context)

**b) "Credits" section (inline)**
- Fetches and displays the same categorized credits data (Writing & Arrangement, Production & Engineering, Performance, Other)
- Reuses the same query logic from `TrackCreditsSheet`
- Displayed inline as a vertical list within the scroll, not as a separate modal
- This replaces the need to open a separate credits sheet from the fullscreen view

**c) "About the Artist" section**
- Shows a small card with the artist's avatar, name, and a "View Profile" button
- Links to `/artist/:id`
- Tapping it closes the fullscreen player and navigates

---

## Technical Details

### Files to Modify

**`src/components/audio/FullscreenPlayer.tsx`** (major rewrite)
- Restructure from static centered layout to scrollable layout
- Add data fetching: `useQuery` for artist tracks, track credits, track features, track registration
- Add "More from this Artist" horizontal carousel
- Add inline credits display
- Add "About the Artist" card
- Fix scroll containment with `overscroll-behavior: contain` and proper `overflow-y: auto`
- Accept new props: `onPlayTrack` callback so tapping a related track plays it

**`src/components/audio/GlobalAudioPlayer.tsx`** (minor changes)
- Make the entire player bar clickable to open fullscreen (not just cover art and title)
- Add `e.stopPropagation()` on interactive buttons (play/pause, skip, close, volume slider, queue toggle)
- Pass `playTrack` function to FullscreenPlayer so related tracks can be played
- The "onOpenCredits" prop can be removed since credits are now inline in the fullscreen view

### Data Fetching (inside FullscreenPlayer)

- **Artist tracks:** `supabase.from('tracks').select('id, title, cover_art_url, audio_url, artist:profiles_public!tracks_artist_id_fkey(id, display_name, avatar_url)').eq('artist_id', artistId).neq('id', currentTrackId).eq('status', 'published').limit(10)`
- **Track credits:** Same query as TrackCreditsSheet -- `supabase.from('track_credits').select('*').eq('track_id', trackId)`
- **Featured artists:** Same query as TrackCreditsSheet
- **Track registration:** `fetchTrackRegistration(trackId)`

All queries are enabled only when `open` is true so they don't fire when the player is collapsed.

### Scroll Behavior Fix

The key CSS properties on the scrollable container:
- `overflow-y: auto`
- `overscroll-behavior: contain` (prevents scroll chaining to parent/background)
- `-webkit-overflow-scrolling: touch` (smooth momentum scrolling on iOS)
- The outer overlay gets `overflow: hidden` and `touch-action: none` on any non-scrollable areas

### No New Dependencies

All features use existing libraries (React Query, Supabase client, framer-motion, Lucide icons).

### No Database Changes

All data already exists in the `tracks`, `track_credits`, `track_features`, and `profiles_public` tables.
