

# Add Edit & Delete for Go DJ Sessions

## Overview
Allow session owners to edit session details (title, description, cover image) and delete sessions from the Artist Profile's Go DJ tab. This builds on the existing `dj_sessions` table which already has an `ALL` RLS policy for `auth.uid() = artist_id`.

## Changes Required

### 1. New Hook Mutations: `src/hooks/useDJSessions.ts`
- **`useUpdateDJSession`**: Mutation to update `dj_sessions` fields (title, description, cover_image_url, status). Invalidates `dj-sessions` queries on success.
- **`useDeleteDJSession`**: Mutation to delete a session by ID from `dj_sessions`. Cascade delete handles `dj_session_tracks` and `dj_session_spotify` automatically (foreign key ON DELETE CASCADE). Invalidates queries on success.

### 2. New Component: `src/components/godj/EditSessionModal.tsx`
A dialog for editing an existing session, pre-populated with current values:
- Title input
- Description textarea
- Cover image upload (same pattern as CreateSessionModal)
- Status toggle (active/archived) so DJs can archive/reactivate sessions
- Save button that calls `useUpdateDJSession`

### 3. Update: `src/pages/ArtistProfile.tsx` (Go DJ tab)
When `isOwnProfile` is true, each `SessionCard` in the session lists gets:
- An **Edit** button (pencil icon) that opens `EditSessionModal`
- A **Delete** button (trash icon) with a confirmation dialog (using AlertDialog)

These controls will be rendered alongside each SessionCard only on the owner's profile, not on public views.

### 4. No Database Changes Needed
- `dj_sessions` already has `ALL` policy for `auth.uid() = artist_id`
- `dj_session_tracks` and `dj_session_spotify` have cascade delete via foreign key
- Status column already supports 'active', 'scheduled', 'archived' values

## Technical Details

### Edit Flow
1. Artist clicks edit icon on a session card
2. Modal opens pre-filled with session's current title, description, cover
3. Artist modifies fields and clicks Save
4. Mutation updates `dj_sessions` row, invalidates cache
5. Modal closes, session list refreshes

### Delete Flow
1. Artist clicks delete icon on a session card
2. AlertDialog confirmation appears: "Delete this session? This cannot be undone."
3. On confirm, mutation deletes from `dj_sessions` (cascades to tracks/spotify)
4. Query cache invalidated, list refreshes
5. Toast confirmation shown

### Files to Create
- `src/components/godj/EditSessionModal.tsx`

### Files to Modify
- `src/hooks/useDJSessions.ts` -- Add update and delete mutations
- `src/pages/ArtistProfile.tsx` -- Add edit/delete controls to session cards on own profile
