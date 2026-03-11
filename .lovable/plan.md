
# Make Recent Updates Available for Mobile

The recent changes (hiding track/follower counts from artist cards, hiding price/collectors from track cards) were applied to the homepage and browse pages, but several other pages still display this data on cards. These pages are used on both desktop and mobile.

## Changes Required

### 1. `src/pages/Artists.tsx` -- Remove tracks/fans from artist cards

**Featured Artists section (lines 149-152):** Remove the stats row showing "X tracks" and "X fans"

**All Artists grid (lines 183-187):** Remove "X tracks" text and "X fans" text below each artist name

### 2. `src/pages/FanDashboard.tsx` -- Remove stats from followed artist cards

**Line 277:** Change `{artist.trackCount} tracks . {artist.followerCount} followers` to just `"Artist"` label

### 3. Cleanup: Remove unused imports/data

- In `Artists.tsx`: Remove `useFollowerCounts` import and hook call since follower counts are no longer displayed on cards
- Remove `formatCompactNumber` import if no longer used
- Remove the `followers` variable assignments in the map callbacks

These are all the remaining places where track/follower counts appear on artist cards and price/editions appear on track cards outside of profile/detail views. The changes ensure consistency across desktop and mobile.
