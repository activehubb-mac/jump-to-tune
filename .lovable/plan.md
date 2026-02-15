

# Add "View Credits" from the Global Audio Player

## Summary

Users currently have no way to view track credits (writers, producers, performers) from the audio player while listening. This update adds a credits bottom sheet accessible by tapping the track cover art in the player bar, and also from tracks in the queue panel.

---

## What Will Change

### 1. New Component: TrackCreditsSheet

A new bottom sheet/drawer component that displays track credits in the same categorized layout already used in TrackDetailModal (Writing and Arrangement, Production and Engineering, Performance, Other).

**File:** `src/components/audio/TrackCreditsSheet.tsx`

- Uses the Vaul drawer (already installed) for a swipeable bottom sheet on mobile, dialog on desktop
- Fetches `track_credits`, `track_features`, and `track_registration` data using React Query (same queries as TrackDetailModal)
- Shows: cover art, track title, artist name, featured artists, categorized credits, recording protection info
- Scrollable content area for tracks with many credits
- Accepts a `trackId` prop so it can show credits for any track (current or queued)

### 2. Player Bar: Cover Art Becomes Clickable

**File:** `src/components/audio/GlobalAudioPlayer.tsx`

The cover art thumbnail (line ~571) in the player bar gets an `onClick` handler that opens the credits sheet for the currently playing track.

- Add a subtle visual hint (e.g., a small `Mic2` icon overlay on hover) so users know it's tappable
- On click: close the queue panel if open, then open the credits sheet

### 3. Queue Panel: Add Credits Button to Track Items

**File:** `src/components/audio/GlobalAudioPlayer.tsx`

Each track in the queue (Now Playing, Up Next, Previously Played) gets a small credits icon button:

- Add a `Mic2` icon button on each queue track row (visible on hover/tap like the existing delete button)
- Clicking it opens the credits sheet for that specific track
- The queue panel stays open underneath the credits sheet (credits sheet has higher z-index)

### 4. Modal Conflict Handling

- When the credits sheet opens from the **player bar**, the queue panel closes automatically
- When the credits sheet opens from a **queue item**, the queue remains visible but the sheet overlays it
- Only one credits sheet can be open at a time (controlled by a single `creditsTrackId` state)
- The credits sheet uses z-index higher than the queue panel (queue is z-50, credits sheet will be z-[60])

---

## Technical Details

### State Management (in GlobalAudioPlayer)
- Add `creditsTrackId: string | null` state
- `setCreditsTrackId(trackId)` opens the sheet for that track
- `setCreditsTrackId(null)` closes the sheet

### Data Fetching (in TrackCreditsSheet)
Reuses the same Supabase queries from TrackDetailModal:
- `track_credits` table filtered by `track_id`
- `track_features` table joined with `profiles_public` for featured artist names
- `fetchTrackRegistration()` for recording protection info
- Artist info passed as a prop from the queue/player context

### Files to Create
- `src/components/audio/TrackCreditsSheet.tsx`

### Files to Modify
- `src/components/audio/GlobalAudioPlayer.tsx` — add credits state, clickable cover art, credits button in queue items, render TrackCreditsSheet

### No Database Changes Needed
All data is already available via existing tables and queries.

