
# Go DJ Mode -- Implementation Plan

This is a large-scale feature spanning database, backend, and frontend. The plan is split into 3 phases to keep each implementation step manageable and testable.

---

## Phase 1: Database Foundation + Core Pages (This Iteration)

### Database Migration

Create 7 new tables with RLS policies:

**`dj_sessions`** -- Core session/playlist table
- `id`, `artist_id`, `title`, `description`, `cover_image_url`
- `status` (active/scheduled/archived), `gating` (public/followers/superfan/limited)
- `max_seats` (nullable, for limited gating)
- `sort_mode` (manual/smart), `pinned_track_ids` (jsonb, max 2)
- `submissions_enabled` (bool), `submission_price_cents` (int), `weekly_submission_cap` (int)
- `submission_guidelines` (text), `refund_policy` (text)
- `scheduled_at` (timestamptz, nullable for countdown)
- `created_at`, `updated_at`
- RLS: artists manage own sessions, public can read active/scheduled sessions

**`dj_session_tracks`** -- Tracks within a session
- `id`, `session_id`, `track_id` (nullable, for JumTunes tracks)
- `embed_url` (text, for Spotify/Apple/YouTube embeds)
- `embed_type` (jumtunes/spotify/apple_music/youtube)
- `position` (int), `added_at`
- RLS: session owner manages, public can read

**`dj_session_listeners`** -- Verified listener tracking
- `id`, `session_id`, `user_id`
- `listened_seconds` (int), `counted` (bool, true when >= 30s)
- `created_at`
- Unique constraint on (session_id, user_id) to prevent duplicates
- RLS: service role manages, users can read own

**`dj_tiers`** -- Per-artist tier tracking
- `id`, `artist_id` (unique)
- `lifetime_listeners` (int, default 0)
- `current_tier` (int, default 1)
- `max_slots` (int, default 1)
- `badge_name` (text, nullable)
- `updated_at`
- RLS: public can read, service role manages

**`dj_submissions`** -- Song submissions from other artists
- `id`, `session_id`, `submitter_id`, `track_id`
- `status` (pending/accepted/rejected/featured)
- `amount_cents` (int), `platform_fee_cents` (int)
- `stripe_payment_intent_id` (text)
- `featured_at` (timestamptz), `min_feature_until` (timestamptz, 7-day minimum)
- `created_at`
- RLS: submitter can read own, session owner can read/update

**`dj_reactions`** -- Reaction system (no comments)
- `id`, `session_id`, `user_id`
- `emoji` (text, constrained to fire/headphones/star/rocket)
- `created_at`
- Unique constraint on (session_id, user_id) -- one reaction per user
- RLS: authenticated users can insert/update/delete own, public can read counts

**`dj_leaderboard`** -- Cached leaderboard data
- `id`, `artist_id`, `period` (monthly/lifetime)
- `listener_count` (int), `reaction_count` (int), `session_count` (int)
- `rank` (int), `computed_at`
- RLS: public can read, service role manages

### Navigation Updates

**`src/components/layout/Navbar.tsx`**
- Add `{ href: "/go-dj", label: "Go DJ", icon: Disc3 }` to `navLinks` array (no `authRequired` -- public page)

### New Pages

**`src/pages/GoDJ.tsx`** -- Discovery page
- Sections: Featured Curators, Trending Sessions, New Sessions, Upcoming Drops, Leaderboard
- Public access with 30-second preview wall
- Click-to-enter only, no autoplay
- Login wall modal after 30 seconds for non-authenticated users

**`src/pages/GoDJSession.tsx`** -- Individual session view
- Track list display, reaction buttons, listener count
- Preview timer for non-logged-in users
- Embed rendering for Spotify/Apple/YouTube

### Artist Profile Integration

**`src/pages/ArtistProfile.tsx`**
- Add new "Go DJ" tab with Disc3 icon
- Show: Active Sessions, Upcoming (with countdown), Archived, Lifetime Listeners, Curator Badge
- "Submit My Song" section visible only if DJ is Tier 2+

### New Hooks

- `src/hooks/useDJSessions.ts` -- CRUD for sessions
- `src/hooks/useDJTiers.ts` -- Read tier data
- `src/hooks/useDJReactions.ts` -- Reaction management
- `src/hooks/useDJListeners.ts` -- Listener counting logic

### New Components

- `src/components/godj/SessionCard.tsx` -- Session preview card
- `src/components/godj/ReactionBar.tsx` -- 4-emoji reaction UI
- `src/components/godj/LoginWallModal.tsx` -- 30s preview wall
- `src/components/godj/SessionTrackList.tsx` -- Track list with embeds
- `src/components/godj/LeaderboardTable.tsx` -- Monthly/lifetime rankings
- `src/components/godj/CountdownTimer.tsx` -- For scheduled sessions
- `src/components/godj/DJBadge.tsx` -- Curator badge display

### Route Registration

**`src/App.tsx`**
- Add `/go-dj` route (public)
- Add `/go-dj/:sessionId` route (public with preview wall)

---

## Phase 2: Session Management + DJ Dashboard (Future)

- Session creation form (title, cover, description, gating, scheduling)
- Drag-and-drop track reordering within sessions
- Smart sort toggle with engagement metrics
- Pin up to 2 tracks in smart mode
- Embed URL input for Spotify/Apple Music/YouTube
- DJ Stats dashboard (lifetime/monthly listeners, reactions, revenue)
- Tier progress visualization
- Listener verification logic (30s minimum, email verified, deduplicated)

---

## Phase 3: Submissions + Monetization + Admin (Future)

- Submit My Song flow (Tier 2+ unlock)
- Stripe payment for submissions (15% platform fee)
- Submission queue management (accept/reject/feature)
- 7-day minimum feature rule with refund logic
- Edge function: `create-submission-checkout`
- Edge function: `process-dj-listener` (verified listener counting + tier upgrades)
- Admin controls: freeze monetization, remove DJs, override badges, feature DJs
- Admin sub-page: `/admin/godj`

---

## Technical Notes

- All listener counting is server-side via edge functions to prevent farming
- Tier upgrades happen automatically when lifetime listener thresholds are reached
- The reaction system uses a unique constraint (session_id, user_id) so users can only have one active reaction
- Embeds from Spotify/Apple Music/YouTube are stored as URLs and rendered via iframe components
- No modifications to the existing audio player or background theme
- The 30-second preview wall for public users mirrors the existing track preview system pattern
