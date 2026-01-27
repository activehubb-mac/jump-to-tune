

# Liked Songs Detail Page Implementation Plan

## Overview
Create a dedicated "Liked Songs" detail page with a Spotify-style interface featuring Play All, Shuffle buttons, sorting options, and track management - modeled after the existing `PlaylistDetail.tsx` component.

## Current State
- "Liked Songs" currently navigates to `/library?filter=liked` which shows an inline filtered view
- The `useLikedTracks` hook already fetches all liked tracks with full metadata
- `PlaylistDetail.tsx` provides a proven template for the detail page pattern

## Implementation Plan

### Step 1: Create the LikedSongsDetail Page
**New file: `src/pages/LikedSongsDetail.tsx`**

Create a dedicated page component that includes:
- **Header section** with gradient cover (purple like Spotify's Liked Songs)
- **Metadata display**: Track count and total duration
- **Action buttons**: Play All, Shuffle
- **Sorting options**: Recently Added, Alphabetical, Artist name
- **Track list**: Scrollable list with play, unlike, and add-to-queue actions

Key features modeled from PlaylistDetail:
- Back navigation to Library
- Track row with cover art, title, artist link, duration
- Current track highlighting
- Individual track play/pause toggle
- Unlike button (heart toggle) on each track

### Step 2: Add Route in App.tsx
Add a new route for the liked songs detail page:
```typescript
<Route path="/library/liked" element={<LikedSongsDetail />} />
```

### Step 3: Update Navigation in Collection.tsx
Change the "Liked Songs" item in the library to navigate to the new dedicated page:
- Update `linkTo` from `/library?filter=liked` to `/library/liked`

### Step 4: Update LibraryListItem.tsx (if needed)
Ensure the "liked-songs" type item navigates correctly to the new route.

---

## Technical Details

### LikedSongsDetail Component Structure

```text
+------------------------------------------+
|  <- Back to Library                      |
+------------------------------------------+
|  +--------+                              |
|  | Purple |  Liked Songs                 |
|  | Heart  |  42 songs · 2 hr 15 min      |
|  | Cover  |                              |
|  +--------+                              |
|                                          |
|  [Play All]  [Shuffle]                   |
+------------------------------------------+
|  Sort: Recently Added  v                 |
+------------------------------------------+
|  [Track Row 1]                           |
|  [Track Row 2]                           |
|  [Track Row 3]                           |
|  ...                                     |
+------------------------------------------+
```

### Track Row Features
- Cover art thumbnail with play overlay on hover
- Track title (highlighted if currently playing)
- Artist name (clickable link to artist profile)
- Duration
- Heart icon to unlike (with optimistic UI update)
- Add to queue option

### Sorting Options
- **Recently Liked**: Default, sorted by `liked_at` descending
- **Alphabetical**: Sorted by track title A-Z
- **Artist**: Grouped/sorted by artist name

### Play All / Shuffle Logic
Reuse the same pattern from PlaylistDetail:
1. Clear queue
2. Play first track (or shuffled first)
3. Add remaining tracks to queue
4. Show feedback toast

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/LikedSongsDetail.tsx` | Create | New dedicated page component |
| `src/App.tsx` | Modify | Add route `/library/liked` |
| `src/pages/Collection.tsx` | Modify | Update "Liked Songs" linkTo to `/library/liked` |

---

## Dependencies
- Uses existing `useLikedTracks` hook for data fetching
- Uses existing `useLikes` hook for unlike functionality  
- Uses `AudioPlayerContext` for playback (playTrack, addToQueue, clearQueue)
- Uses `formatDuration` utility for time display
- Follows existing UI patterns from PlaylistDetail

