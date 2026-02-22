
# Admin Dashboard Expansion + Spotify Embed

## Overview
Add admin controls for managing home page sections (New Releases, Trending Now, Discover Artists) and a new Stores management tab, plus embed a Spotify player widget on the home page.

---

## 1. Admin Home Page Controls (New Admin Tab)

Create a new admin sub-page **"Home"** (`/admin/home`) that gives admins control over the home page sections:

### New Releases Control
- Toggle section visibility on/off
- Set the lookback window (default 7 days, adjustable to 14, 30, etc.)
- Set max items displayed (default 6)
- Pin specific tracks to always appear in New Releases

### Trending Now Control
- Toggle section visibility on/off
- Pin/unpin specific tracks to the top of trending
- Override trending order manually
- Set the number of items displayed

### Discover Artists Control
- Toggle section visibility on/off
- Manually feature specific artists in the Discover section
- Set the number of artists shown

These settings will be stored in a new `admin_home_settings` table with key-value pairs so they can be read by the home page.

---

## 2. Artist Stores Tab (Admin)

Add a new **"Stores"** tab (`/admin/stores`) to the admin dashboard showing:

- List of all artist stores with status (active/inactive)
- Store owner name and avatar
- Product count and total revenue per store
- Ability to toggle store active/inactive (moderation)
- Link to view the artist's store page

---

## 3. Spotify Embedded Player

Add a Spotify embed widget to the home page:

- Place it as a section on the home page (after Trending or before the footer)
- Use Spotify's oEmbed iframe (`open.spotify.com/embed`)
- Admin can set the Spotify URI (playlist, album, or track) from the Admin Home settings tab
- Default to a JumTunes-curated Spotify playlist URI
- Responsive sizing for mobile and desktop

---

## Technical Details

### Database Migration
- **`admin_home_settings`** table:
  - `id` (uuid, PK)
  - `setting_key` (text, unique) -- e.g. `new_releases_enabled`, `trending_pinned_ids`, `spotify_embed_uri`
  - `setting_value` (jsonb)
  - `updated_at` (timestamptz)
  - RLS: admins can read/write, public can read

### New Files
- `src/pages/admin/AdminHome.tsx` -- Home page section controls
- `src/pages/admin/AdminStores.tsx` -- Artist stores management
- `src/hooks/useAdminHomeSettings.ts` -- Hook to read/write home settings
- `src/components/home/SpotifyEmbed.tsx` -- Spotify embed component

### Modified Files
- `src/pages/admin/AdminDashboard.tsx` -- Add "Home" and "Stores" nav items
- `src/App.tsx` -- Add routes for `/admin/home` and `/admin/stores`
- `src/pages/Index.tsx` -- Read admin settings for section visibility, pinned items, and render Spotify embed
- `src/hooks/useNewReleases.ts` -- Accept admin overrides (lookback window, pinned tracks)
- `src/hooks/useTrendingTracks.ts` -- Accept admin-pinned tracks

### Admin Nav Update
Add two new tabs to the admin sidebar:
- **Home** (icon: Home) at `/admin/home`
- **Stores** (icon: Store) at `/admin/stores`
