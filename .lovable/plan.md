

# Enhance Fullscreen Player: Rich Artist Section and Credits Dialog

## What Changes

### 1. Replace the small "About the Artist" card with a rich, immersive section

Currently: A tiny row with avatar, name, and "View full profile" link that navigates away.

New design: A full-width section inspired by the Spotify reference, containing:
- **Large artist banner image** (or avatar fallback) displayed as a wide card with overlay text
- **Artist name** overlaid on the banner (bold, large)
- **Follower count** displayed beneath the banner
- **Bio text** shown inline (first 3 lines with "Show more" expansion)
- **"Follow" button** if the user is not already following
- All of this stays within the fullscreen player -- no navigation away

Data needed: Fetch from `profiles_public` (banner_image_url, bio, avatar_url, display_name) and `follows` table (follower count). These queries already exist in the codebase via `useFollowerCounts` and `useArtistProfile`.

### 2. Add a visible "View Song Credits" button that opens a credits Drawer

Currently: Credits are displayed inline as plain text below the controls, and also available in the "..." menu.

New design:
- Remove the inline credits section from the scroll area
- Add a prominent **"View Song Credits"** row button (with a Mic2 icon) in the scrollable area, styled like a list item
- Tapping it opens the existing `TrackCreditsSheet` drawer (already built at z-[60]) with the full categorized credits layout
- The `Mic2` icon button in the action row also still triggers this same drawer
- The credits option in the "..." menu also triggers this same drawer

### 3. Restructure the scrollable content order

New order after the action row:
1. **"More from [Artist Name]"** -- horizontal track carousel (keep as is)
2. **"View Song Credits"** -- tappable row that opens the credits drawer
3. **"About the Artist"** -- rich section with banner, bio, followers (no routing away)
4. **JumTunes Recording ID** -- shown at the bottom if available

---

## Technical Details

### Files to Modify

**`src/components/audio/FullscreenPlayer.tsx`**

- Add new queries:
  - Fetch artist profile details: `supabase.from('profiles_public').select('id, display_name, avatar_url, banner_image_url, bio').eq('id', artistId).maybeSingle()`
  - Fetch follower count: `supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', artistId)`
- Replace the current "About the Artist" button with a rich card:
  - Full-width banner image (rounded, ~200px tall) with artist name overlay at bottom
  - Follower count text below
  - Bio text with truncation (3 lines, expandable)
- Replace inline credits section with a "View Song Credits" tappable row
- The `onOpenCredits` callback (already wired) opens the `TrackCreditsSheet` drawer
- Move the Recording ID display to a standalone small section at the bottom

### No new files needed

The `TrackCreditsSheet` component already exists and handles the full credits display with categorized layout, featured artists, and recording protection info.

### No database changes needed

All data is available from existing tables (`profiles_public`, `follows`, `track_credits`, `track_features`, `track_registrations`).

