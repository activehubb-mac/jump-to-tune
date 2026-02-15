

# Fix: Complete Track and Album Delete Functionality

## Summary

There are three gaps in the delete system: the Label Dashboard delete is broken (only logs to console), there's no way to delete albums/EPs, and there's no way to remove individual tracks from an album. This plan addresses all three.

---

## Change 1: Fix Label Dashboard Delete (Bug Fix)

**File:** `src/pages/LabelDashboard.tsx`

The `onDelete` handler on line 447 currently does `console.log("Delete track:", id)` instead of actually deleting. This needs the same delete logic that already exists in `ArtistDashboard.tsx` and `LabelTracks.tsx`:

- Add `deleteTrackId` state and `handleDelete` function (same pattern as ArtistDashboard)
- Replace `console.log` with `setDeleteTrackId(id)`
- Add the `AlertDialog` delete confirmation modal

---

## Change 2: Add Album/EP Delete Capability

**Files:** `src/pages/ArtistTracks.tsx`, `src/pages/LabelTracks.tsx`

Add album management alongside tracks. Artists and labels need to see their albums and delete them. When an album is deleted, all tracks within it should also be deleted (cascade).

### Database consideration
The `albums` table has RLS policies allowing artists to delete their own albums (`auth.uid() = artist_id`) and labels to delete theirs (`auth.uid() = label_id`). However, tracks within the album reference `album_id` -- we need to ensure deleting an album also removes its tracks, or handle this in application logic by deleting tracks first, then the album.

### Implementation approach
- Add an "Albums" tab or section to both `ArtistTracks` and `LabelTracks` pages showing albums/EPs
- Each album card gets a delete button with confirmation dialog
- Delete flow: first delete all tracks with matching `album_id`, then delete the album itself
- Both operations are already permitted by existing RLS policies

---

## Change 3: Remove Individual Tracks from Albums

**File:** New component or update to `AlbumDetail.tsx`

For the album owner (artist or label), show edit/delete actions on individual tracks within the album view:

- Detect if the current user is the album owner (compare `user.id` with `album.artist_id` or `album.label_id`)
- If owner, show a delete button on each track row
- Deleting a track from an album removes it from the `tracks` table (existing RLS allows this)
- After deletion, the album track list refreshes

---

## Technical Details

### Delete Album Flow (Application Logic)
```text
1. User clicks "Delete Album" -> Confirmation dialog
2. On confirm:
   a. DELETE FROM tracks WHERE album_id = :albumId
   b. DELETE FROM albums WHERE id = :albumId
3. Invalidate queries: ["tracks"], ["albums"], ["artist-stats"] / ["label-stats"]
4. Show success feedback
```

### Files Modified
- `src/pages/LabelDashboard.tsx` -- fix broken delete handler
- `src/pages/ArtistTracks.tsx` -- add album section with delete
- `src/pages/LabelTracks.tsx` -- add album section with delete
- `src/pages/AlbumDetail.tsx` -- add owner track management (edit/delete per track)

### No Database Changes Needed
All required RLS policies already exist:
- Artists can delete their own tracks and albums
- Labels can delete their tracks and albums
- The delete operations use standard Supabase client calls

