

# Fix: Make Label Dashboard Track Cards Clickable

## The Problem

On the **Label Dashboard**, clicking a track card in "Recent Releases" does nothing. The track cards render but have no `onClick` handler and no `TrackDetailModal` is wired up.

Meanwhile, the **Artist Dashboard** already works correctly -- clicking a track opens a detail modal showing full track info, play controls, and the new Recording ID.

## The Fix

Mirror what the Artist Dashboard already does:

1. **Add state** for `selectedTrack` in `LabelDashboard.tsx`
2. **Add `onClick`** handler to each `TrackCard` in the Recent Releases grid
3. **Add `TrackDetailModal`** component to the page
4. Import the required component

## What Changes

**File: `src/pages/LabelDashboard.tsx`**

- Import `TrackDetailModal` from `@/components/dashboard/TrackDetailModal`
- Add `selectedTrack` state (useState)
- Add `onClick={() => setSelectedTrack(track)}` to each TrackCard in the Recent Releases grid
- Add `<TrackDetailModal>` at the bottom of the component, same pattern as ArtistDashboard

## Who Benefits

- **Label owners** can now click any release to see full track details, play the track, view the Recording ID, and download certificates
- **Consistency** between Artist and Label dashboards

## Scope

This is a small, focused change -- only `LabelDashboard.tsx` is modified. No new files, no database changes.

