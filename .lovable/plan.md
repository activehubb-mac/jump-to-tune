

## Feature Status Report

### Working Correctly
1. **Layout cleanup** — `PromotedAvatars` is removed from `Layout.tsx`. No import or render of it remains in Layout.
2. **Admin panel simplification** — `AdminAvatarPromotions.tsx` correctly removed `promotion_type` and `animation_type` dropdowns. Only artist, optional track, and exposure zone remain.
3. **Fullscreen player lyrics** — `FullscreenPlayer.tsx` has the `LyricsDisplay` overlay with `Type` toggle button, properly wired.
4. **Lyrics data passing** — `GlobalAudioPlayer.tsx` passes `lyrics={karaokeData?.lyrics || null}` to `FullscreenPlayer`.
5. **Like button in player** — Heart toggle is in both mini player and fullscreen player, using `useLikes`.
6. **InstantPurchaseModal auto-close** — Calls `onOpenChange(false)` on success so the track plays immediately.

### Broken: FeaturedArtistSlideshow NOT updated
**`src/components/effects/FeaturedArtistSlideshow.tsx`** was never rewritten. It still:
- Uses `useFeaturedArtists("artists_page")` instead of `useActiveAvatarPromotions`
- Shows on `/artist/*` routes instead of `/browse`
- Uses 10-second intervals instead of 7-second
- Does NOT consume the `avatar_promotions` table at all

This means the admin panel creates promotions in `avatar_promotions`, but the slideshow reads from `featured_content` — **they are completely disconnected**.

### Fix required
Rewrite `FeaturedArtistSlideshow.tsx` to:
1. Import and use `useActiveAvatarPromotions` from `@/hooks/useAvatarPromotions`
2. Show on Home (`/`, `/index`) and Browse (`/browse`) — pass the correct zone
3. Change timing to 7s cycle, 3s visible
4. Read `artist.avatar_url` and `artist.display_name` from the promotions data shape

### One additional cleanup
The file `src/components/effects/PromotedAvatars.tsx` still exists on disk (orphaned). It's no longer imported anywhere but should be deleted to avoid confusion.

