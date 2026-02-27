

# Go DJ Mix Builder -- Full Implementation Plan

## Overview
Replace the current simple session creation with a full DJ Mix Builder. Artists can select JumTunes tracks, record voice clips, arrange a timeline with trim/fade controls, and publish. Playback is sequential (tracks + voice clips play in order) since server-side rendering is deferred. The existing JumTunes player is NOT modified.

---

## Phase 1: Database Migration

### New Tables

**`go_dj_profiles`**
- `id` uuid PK
- `user_id` uuid (unique, NOT NULL)
- `is_enabled` boolean default false
- `enabled_at` timestamptz
- `display_name` text
- `avatar_url` text
- `created_at` timestamptz
- RLS: Users manage own row, public can read enabled profiles

**`go_dj_sessions`**
- `id` uuid PK
- `dj_user_id` uuid NOT NULL
- `title` text NOT NULL
- `description` text
- `cover_url` text
- `visibility` text default 'public' (public | unlisted)
- `mode` text default 'standard' (standard | pro)
- `status` text default 'draft' (draft | rendering | published | failed)
- `mix_audio_url` text (nullable, for future render pipeline)
- `duration_sec` integer (nullable)
- `created_at`, `updated_at`
- RLS: Owner can CRUD, public can SELECT where visibility='public' AND status='published', anyone can SELECT by direct ID if unlisted

**`go_dj_voice_clips`**
- `id` uuid PK
- `dj_user_id` uuid NOT NULL
- `session_id` uuid (nullable FK to go_dj_sessions)
- `file_url` text NOT NULL
- `duration_sec` integer NOT NULL
- `label` text default 'Voice Clip'
- `created_at`
- RLS: Owner manages own clips

**`go_dj_segments`**
- `id` uuid PK
- `session_id` uuid FK to go_dj_sessions NOT NULL
- `segment_type` text NOT NULL (track | voice)
- `order_index` integer NOT NULL
- `track_id` uuid (nullable, FK concept to tracks table)
- `voice_clip_id` uuid (nullable, FK to go_dj_voice_clips)
- `trim_start_sec` integer default 0
- `trim_end_sec` integer (nullable)
- `fade_in_sec` numeric default 0
- `fade_out_sec` numeric default 0
- `overlay_start_sec` integer (nullable, Pro mode)
- `overlay_end_sec` integer (nullable, Pro mode)
- `voice_volume` integer default 100
- `ducking_enabled` boolean default true
- `ducking_db` integer default -10
- `created_at`
- RLS: Session owner manages, public can read for published sessions

**`go_dj_reactions`**
- `id` uuid PK
- `session_id` uuid NOT NULL
- `user_id` uuid NOT NULL
- `reaction` text NOT NULL
- `created_at`
- Unique on (session_id, user_id)
- RLS: Authenticated can insert/update/delete own, public can read

**`go_dj_listens`**
- `id` uuid PK
- `session_id` uuid NOT NULL
- `user_id` uuid (nullable)
- `listened_at` timestamptz default now()
- RLS: Public can insert (for anonymous tracking), public can read counts

### Storage Buckets
- **`go-dj-voice`** (public, for voice clip audio files)
- **`go-dj-mix-renders`** (public, for future rendered mixes)

---

## Phase 2: Hooks Layer

### `src/hooks/useGoDJProfile.ts`
- `useGoDJProfile(userId)` -- fetch go_dj_profiles row
- `useActivateGoDJ()` -- insert/update go_dj_profiles with is_enabled=true
- Replaces useDJActivation for the new system

### `src/hooks/useGoDJSessions.ts`
- `useGoDJSessions(userId?)` -- list sessions
- `useGoDJSessionDetail(sessionId)` -- single session with segments
- `useCreateGoDJSession()` -- insert into go_dj_sessions
- `useUpdateGoDJSession()` -- update metadata/status
- `useDeleteGoDJSession()` -- delete session
- `usePublishGoDJSession()` -- set status to 'published' (mock render: skip rendering step, go straight to published)

### `src/hooks/useGoDJSegments.ts`
- `useGoDJSegments(sessionId)` -- fetch ordered segments with joined track data
- `useAddSegment()` -- insert segment
- `useUpdateSegment()` -- update trim/fade/order
- `useRemoveSegment()` -- delete segment
- `useReorderSegments()` -- batch update order_index values

### `src/hooks/useGoDJVoiceClips.ts`
- `useGoDJVoiceClips(sessionId)` -- list clips for session
- `useRecordVoiceClip()` -- upload recorded audio blob to go-dj-voice bucket, insert row
- `useDeleteVoiceClip()` -- remove from storage + DB

### `src/hooks/useGoDJReactions.ts`
- `useGoDJReactions(sessionId)` -- fetch reaction counts + user's reaction
- `useReactToMix()` -- upsert reaction

### `src/hooks/useGoDJListens.ts`
- `useGoDJListenerCount(sessionId)` -- count listens
- `useRecordListen()` -- insert listen record

---

## Phase 3: Components

### New Components in `src/components/godj-mix/`

**`MixWizard.tsx`** -- Create New Session Mix dialog
- Step 1: Title, cover image, description, visibility (public/unlisted)
- Step 2: Mix Style toggle (Standard V1 / Pro DJ V2 -- Pro hidden if feature flag off)
- Creates draft session and redirects to Mix Builder page

**`MixBuilder.tsx`** -- Full-page mix editor (the core screen)
- Layout with 3 panels:
  - **Track Picker Panel**: Search JumTunes catalog, click to add track segment to timeline
  - **Voice Panel**: Record button (MediaRecorder API), clips list with playback/rename/delete
  - **Timeline Panel**: Ordered list of segments (track blocks + voice blocks)
- Each segment block shows inline controls

**`TrackSegmentBlock.tsx`** -- Individual track in the timeline
- Shows track cover, title, artist
- Trim Start / Trim End sliders (in seconds, range 0 to track duration)
- Fade In / Fade Out sliders (0-2 seconds)
- Move up/down buttons, remove button
- Duration display (trimmed length)

**`VoiceSegmentBlock.tsx`** -- Voice clip in the timeline
- Shows clip label, duration
- In Standard mode: can only be placed between track segments (enforced in UI)
- In Pro mode: shows overlay timestamp inputs + auto-duck toggle + volume slider
- Move up/down, remove button

**`VoiceRecorder.tsx`** -- Voice recording component
- Uses MediaRecorder API (browser native)
- Record/Stop toggle button
- Live recording timer (max 20s default, configurable)
- Preview playback of recorded clip
- Save button: uploads to `go-dj-voice` bucket, creates DB row
- Enforces total voice limit per session (default 2 minutes)

**`MixPreviewPlayer.tsx`** -- In-editor preview
- "Preview Mix" button that plays segments sequentially in-browser
- For Standard mode: plays track (trimmed) then voice then track etc.
- Shows current segment highlight in timeline
- Note text: "Final audio is rendered on Publish for best quality."
- Uses a dedicated Audio element (NOT the global player)

**`MixPlaybackPage.tsx`** -- Fan-facing published mix player (new page component)
- Cover art, title, DJ name
- Reaction bar (fire/star/rocket/headphones)
- Listener count
- Chapter list (tracklist with calculated timestamps)
- Play Mix button -- plays segments sequentially using a dedicated player
- Chapter items are clickable to seek (jump to that segment)
- Does NOT use the existing global player

**`MixSessionCard.tsx`** -- Card for discovery/profile listing
- Shows cover, title, DJ name, status badge (Draft/Rendering/Published)
- Duration, segment count
- Click navigates to mix playback page (if published) or builder (if draft + owner)

---

## Phase 4: Pages

### `src/pages/GoDJMixBuilder.tsx`
- Route: `/go-dj/mix/:sessionId/edit`
- Protected: only session owner can access
- Full-page editor using MixBuilder component
- Top bar: session title, status, Save Draft / Publish buttons
- Publish flow: validates (at least 1 track, Standard mode voice placement), sets status to 'published'

### `src/pages/GoDJMixPlayback.tsx`
- Route: `/go-dj/mix/:sessionId`
- Public page for published mixes
- Uses MixPlaybackPage component
- 30-second preview wall for non-authenticated users (reuse LoginWallModal pattern)

### Route Registration in `src/App.tsx`
- Add `/go-dj/mix/:sessionId/edit` (authenticated)
- Add `/go-dj/mix/:sessionId` (public)

---

## Phase 5: Integration Points

### Artist Profile Go DJ Tab (`src/pages/ArtistProfile.tsx`)
- When `isOwnProfile`:
  - Keep existing activation flow but wire to `go_dj_profiles` table
  - Replace "New Session" button with "New Session Mix" which opens MixWizard
  - List sessions from `go_dj_sessions` with status badges (Draft/Published)
  - Draft sessions show "Continue Editing" link to builder
  - Published sessions link to playback page
  - Keep edit/delete controls

### Go DJ Discovery Page (`src/pages/GoDJ.tsx`)
- Add CTA at top: "Start a Go DJ Session" (if user has Go DJ enabled)
- Trending Sessions section queries `go_dj_sessions` where status='published' and visibility='public'
- Session cards use MixSessionCard component

### Existing Go DJ System
- The old `dj_sessions` / `dj_session_tracks` / `dj_session_spotify` tables and their hooks remain for backward compatibility
- New mix sessions use the `go_dj_*` tables exclusively
- Over time, old sessions can be migrated or deprecated

---

## Phase 6: Playback Engine (Sequential, No Render)

Since rendering is deferred, published mixes play via a custom sequential player:

1. Fetch ordered segments for the session
2. For each segment in order:
   - If track: create audio element, set currentTime to trim_start_sec, play until trim_end_sec (or end), apply fade via gain node
   - If voice: play voice clip audio
3. Track transitions: apply fade-out on current, fade-in on next
4. Pro mode overlay: play voice clip simultaneously with music, reduce music volume by ducking_db (using Web Audio API gain nodes)
5. Chapter seeking: calculate cumulative timestamps from segment durations, clicking a chapter jumps to that segment

This runs entirely in-browser using the Web Audio API for gain/ducking control and standard HTMLAudioElement for playback.

---

## Technical Notes

- **Voice Recording**: Uses `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder` API. Outputs webm/opus or wav depending on browser. Uploaded to `go-dj-voice` bucket.
- **Trim/Fade**: Stored as metadata in `go_dj_segments`. Applied at playback time via Web Audio API (no server processing needed for sequential playback).
- **Pro Mode Ducking**: Uses Web Audio API `GainNode` to reduce music volume during voice overlay sections. The voice audio plays simultaneously with the track audio.
- **Voice Limits**: Max 20s per clip, max 120s total voice per session. Enforced in the recorder UI and validated on publish.
- **Standard Mode Constraint**: Voice segments can only be placed between track segments (not on top). UI enforces this by only allowing voice insertion at gaps between tracks.
- **No changes to existing global audio player** -- mix playback uses its own dedicated audio elements.
- **Feature flag**: `pro_mode_enabled` can be stored in `admin_home_settings` or `ai_feature_flags` table. If off, Pro DJ toggle is hidden in the wizard.

---

## Files Summary

### New Files (~15)
- `src/hooks/useGoDJProfile.ts`
- `src/hooks/useGoDJSessions.ts`
- `src/hooks/useGoDJSegments.ts`
- `src/hooks/useGoDJVoiceClips.ts`
- `src/hooks/useGoDJReactions.ts`
- `src/hooks/useGoDJListens.ts`
- `src/components/godj-mix/MixWizard.tsx`
- `src/components/godj-mix/MixBuilder.tsx`
- `src/components/godj-mix/TrackSegmentBlock.tsx`
- `src/components/godj-mix/VoiceSegmentBlock.tsx`
- `src/components/godj-mix/VoiceRecorder.tsx`
- `src/components/godj-mix/MixPreviewPlayer.tsx`
- `src/components/godj-mix/MixPlaybackPage.tsx`
- `src/components/godj-mix/MixSessionCard.tsx`
- `src/pages/GoDJMixBuilder.tsx`
- `src/pages/GoDJMixPlayback.tsx`
- 1 migration file

### Modified Files (~3)
- `src/App.tsx` -- add 2 new routes
- `src/pages/ArtistProfile.tsx` -- wire Go DJ tab to new system
- `src/pages/GoDJ.tsx` -- add CTA and show published mixes

