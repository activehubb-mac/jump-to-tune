

# Admin Home Controls, Stores Tab, and Homepage Integration

## Overview
Build the remaining admin dashboard features: a "Home" tab for controlling homepage sections (New Releases, Trending, Discover Artists, Spotify embed), a "Stores" tab for managing artist stores, and wire the homepage to respect these admin settings. All views will be mobile-optimized.

---

## Step 1: Database Migration

Create the `admin_home_settings` table to store key-value configuration:

| Column | Type | Details |
|--------|------|---------|
| id | uuid | Primary key |
| setting_key | text | Unique key (e.g. `new_releases_enabled`) |
| setting_value | jsonb | The value |
| updated_at | timestamptz | Auto-updated |

**RLS Policies:**
- Public can SELECT (homepage needs to read settings)
- Admins can INSERT/UPDATE/DELETE (via `has_admin_role`)
- Service role full access

**Default seed data (8 rows):**
- `new_releases_enabled` -> true
- `new_releases_lookback_days` -> 7
- `new_releases_limit` -> 6
- `trending_enabled` -> true
- `trending_limit` -> 12
- `discover_artists_enabled` -> true
- `discover_artists_limit` -> 6
- `spotify_embed_uri` -> "" (empty = hidden)

---

## Step 2: New Hook - useAdminHomeSettings

Create `src/hooks/useAdminHomeSettings.ts`:
- `useAdminHomeSettings()` -- reads all settings as a typed object (used by homepage and admin page)
- `useUpdateAdminHomeSetting()` -- mutation to upsert a single setting (admin only)
- Strongly typed interface for all setting keys

---

## Step 3: Admin Home Page (`/admin/home`)

Create `src/pages/admin/AdminHome.tsx` with three card sections, mobile-responsive:

**New Releases Card:**
- Toggle enabled/disabled (Switch)
- Lookback window selector (7, 14, 30 days)
- Max items slider (3-12)

**Trending Now Card:**
- Toggle enabled/disabled
- Max items slider (6-24)

**Discover Artists Card:**
- Toggle enabled/disabled
- Max items slider (3-12)

**Spotify Embed Card:**
- Text input for Spotify URI (playlist/album/track URL)
- Preview of the embed below the input
- Clear button to remove

Layout: Single column on mobile, 2-column grid on desktop.

---

## Step 4: Admin Stores Page (`/admin/stores`)

Create `src/pages/admin/AdminStores.tsx`:
- Query `artist_stores` joined with `profiles_public` for artist info
- Query `store_products` for product counts per store
- Query `store_orders` for revenue aggregates per store
- Display as responsive card grid (1 col mobile, 2 col tablet, 3 col desktop)
- Each card shows: artist avatar, name, store status badge, product count, total revenue
- Toggle button to activate/deactivate store (updates `store_status`)
- Link to view the artist's store page

---

## Step 5: Update Admin Dashboard Navigation

Modify `src/pages/admin/AdminDashboard.tsx`:
- Add "Home" nav item (Home icon) at `/admin/home`
- Add "Stores" nav item (Store icon) at `/admin/stores`

---

## Step 6: Update Routes

Modify `src/App.tsx`:
- Import `AdminHome` and `AdminStores`
- Add nested routes: `<Route path="home" element={<AdminHome />} />` and `<Route path="stores" element={<AdminStores />} />`

---

## Step 7: Wire Homepage to Admin Settings

Modify `src/pages/Index.tsx`:
- Import and call `useAdminHomeSettings()`
- Conditionally render New Releases section based on `new_releases_enabled`
- Pass `new_releases_lookback_days` and `new_releases_limit` to `useNewReleases`
- Conditionally render Trending section based on `trending_enabled`
- Conditionally render Discover Artists section based on `discover_artists_enabled`
- Render Spotify embed section if `spotify_embed_uri` is non-empty

Modify `src/hooks/useNewReleases.ts`:
- Accept optional `lookbackDays` and `limit` parameters (defaults preserved)

Modify `src/components/home/TrendingCarousel.tsx`:
- Accept optional `limit` prop override

Create `src/components/home/SpotifyEmbedSection.tsx`:
- Accepts a Spotify URI string
- Validates and converts to embed URL
- Renders responsive iframe in a styled container
- Lazy-loads with IntersectionObserver

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/hooks/useAdminHomeSettings.ts` |
| Create | `src/pages/admin/AdminHome.tsx` |
| Create | `src/pages/admin/AdminStores.tsx` |
| Create | `src/components/home/SpotifyEmbedSection.tsx` |
| Modify | `src/pages/admin/AdminDashboard.tsx` |
| Modify | `src/App.tsx` |
| Modify | `src/pages/Index.tsx` |
| Modify | `src/hooks/useNewReleases.ts` |
| Modify | `src/components/home/TrendingCarousel.tsx` |
| Migration | `admin_home_settings` table + RLS + seed data |

