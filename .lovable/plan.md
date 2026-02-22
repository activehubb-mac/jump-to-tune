

# Add Homepage Sections to Featured Content Display Locations

## What's Changing

The "Add Featured Track" modal's **Display Location** dropdown currently only has options like "Home Page - Hero Carousel" and "Browse Page - Featured Section". You want to also control which tracks appear in the **New Releases**, **Trending Now**, and **Discover Artists** homepage sections from this admin Featured panel.

## Implementation

### 1. Update Display Location Options

Add new location values to the `DISPLAY_LOCATIONS` constant in `AdminFeatured.tsx`:

**For tracks:**
- "home_new_releases" -- "Home Page - New Releases"
- "home_trending" -- "Home Page - Trending Now"

**For artists:**
- "home_discover_artists" -- "Home Page - Discover Artists"

**For albums:**
- "home_new_releases" -- "Home Page - New Releases"

### 2. Wire Homepage Sections to Featured Content

Update the homepage hooks/components to check `featured_content` for pinned items:

- **`useNewReleases.ts`**: After fetching recent tracks, prepend any tracks pinned to `home_new_releases` (from `featured_content` table) to the top of the list.
- **`TrendingCarousel.tsx` / `useTrendingTracks.ts`**: Prepend tracks pinned to `home_trending` to the trending results.
- **`Index.tsx` (Discover Artists section)**: Query `featured_content` where `display_location = 'home_discover_artists'` and merge those artists into the discover section.

### 3. Create a shared hook for pinned homepage content

Create `src/hooks/usePinnedHomepageContent.ts` that queries `featured_content` filtered by the homepage display locations (`home_new_releases`, `home_trending`, `home_discover_artists`) where `is_active = true` and within date range. This avoids duplicating the same query across multiple hooks.

## Technical Details

### Files Modified
| File | Change |
|------|--------|
| `src/pages/admin/AdminFeatured.tsx` | Add `home_new_releases`, `home_trending`, `home_discover_artists` to `DISPLAY_LOCATIONS` |
| `src/hooks/useNewReleases.ts` | Merge pinned tracks from `featured_content` into results |
| `src/hooks/useTrendingTracks.ts` | Merge pinned tracks from `featured_content` into results |
| `src/pages/Index.tsx` | Use pinned artists for Discover Artists section |

### Files Created
| File | Purpose |
|------|---------|
| `src/hooks/usePinnedHomepageContent.ts` | Shared hook to fetch active featured_content by display_location |

### No database changes needed
The existing `featured_content` table and `display_location` text column already support arbitrary location strings. No migration required.

