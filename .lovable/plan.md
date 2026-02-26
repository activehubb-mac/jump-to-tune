
# Go DJ Creation Panel -- Artist Dashboard Integration

## Overview
Add a Go DJ activation flow and session creation panel to the Artist Profile's "Go DJ" tab. When an artist views their own profile's Go DJ tab, they can activate Go DJ mode and create new sessions.

## Changes Required

### 1. New Component: `src/components/godj/CreateSessionModal.tsx`
A modal/dialog for creating a new DJ session with:
- **Title** input (required)
- **Cover image upload** -- upload to `covers` storage bucket (reuse pattern from `CoverArtUpload`)
- **Description** textarea
- **Add tracks section**:
  - Search and add JumTunes tracks (query `tracks` table, show results)
  - Add embed URL (Spotify/Apple Music/YouTube) with type selector
  - Display added tracks in a reorderable list
- **Publish button** -- inserts into `dj_sessions` and `dj_session_tracks`
- **Slot counter** -- shows "X/Y sessions" based on tier's `max_slots` (e.g., "1/1")

### 2. New Hook Addition: `src/hooks/useDJSessions.ts`
Add a new mutation `useAddSessionTrack` for inserting into `dj_session_tracks` table after session creation.

### 3. New Hook: `src/hooks/useDJActivation.ts`
- Check if artist has a `dj_tiers` row (activation state)
- Mutation to create initial `dj_tiers` row (tier 1, 0 listeners, 1 slot)

### 4. Update: `src/pages/ArtistProfile.tsx` (Go DJ tab, own-profile view only)
When `isOwnProfile` is true, the Go DJ tab will show:
- **If not activated** (no `dj_tiers` row): "Enable Go DJ Mode" card with "Activate Go DJ" button
- **If activated**: 
  - Slot counter badge (e.g., "1/1 sessions used")
  - "Create New Session" button (disabled if slots full)
  - Existing session lists (active/scheduled/archived) -- already implemented

### 5. Database: No schema changes needed
- `dj_tiers` table already supports INSERT by artists (`auth.uid() = artist_id`)
- `dj_sessions` table already supports full CRUD by artists
- `dj_session_tracks` table already supports management by session owners
- `covers` storage bucket already exists and is public

## Technical Details

### Session Creation Flow
1. Artist clicks "Create New Session"
2. Modal opens with form fields
3. Cover image uploaded to `covers` bucket with path `dj-sessions/{userId}/{timestamp}.ext`
4. On publish: insert `dj_sessions` row, then batch insert `dj_session_tracks` rows
5. Invalidate `dj-sessions` query cache
6. Close modal, show success feedback

### Track Addition in Session Builder
- **JumTunes tracks**: Text search input querying `tracks` table (title ILIKE), showing results in dropdown. Selected tracks stored with `embed_type: 'jumtunes'` and `track_id` set.
- **External embeds**: URL input + type dropdown (spotify/apple_music/youtube). Stored with `embed_url` and `embed_type`.
- Tracks shown in numbered list with remove button.

### Slot Counter Logic
- Count active + scheduled sessions for the artist
- Compare against `dj_tiers.max_slots`
- Disable "Create New Session" when at capacity

### Activation Logic
- Query `dj_tiers` for current user
- If no row exists, show activation prompt
- On activate: insert `dj_tiers` row with defaults (tier 1, max_slots 1)

## Files to Create
- `src/components/godj/CreateSessionModal.tsx`

## Files to Modify
- `src/pages/ArtistProfile.tsx` -- Add activation UI and create button to Go DJ tab (own profile only)
- `src/hooks/useDJSessions.ts` -- Add `useAddSessionTracks` mutation
- `src/hooks/useDJTiers.ts` -- Add `useActivateDJ` mutation
