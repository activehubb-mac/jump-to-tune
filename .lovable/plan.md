

## Summary

Replace the floating avatar circles (PromotedAvatars) with a full background slideshow powered by the same `avatar_promotions` table. Featured artists will appear as large, centered background images on Home and Browse pages — visible for 3 seconds every 7 seconds. The admin panel will be simplified to match this new flow.

## Changes

### 1. Remove PromotedAvatars from Layout
- **`src/components/layout/Layout.tsx`** — Remove the `<PromotedAvatars />` import and rendering. The floating small circles in the gutters are gone.

### 2. Rewire FeaturedArtistSlideshow to use avatar_promotions
- **`src/components/effects/FeaturedArtistSlideshow.tsx`** — Instead of querying `featured_content` via `useFeaturedArtists`, it will use `useActiveAvatarPromotions` from the existing hook. Show on Home (`/`, `/index`) AND Browse (`/browse`). Cycle every 7 seconds, visible for 3 seconds. Display the artist avatar at regular/full size centered in the background with a subtle fade.

### 3. Simplify AdminAvatarPromotions
- **`src/components/admin/AdminAvatarPromotions.tsx`** — Remove the `promotion_type` and `animation_type` dropdowns since the promotion is now always a background slideshow. Keep: artist selection, optional linked track, and exposure zone (home / browse / global). Update the header description to say "Background slideshow on Home & Browse pages."

### Files to modify
- `src/components/layout/Layout.tsx` — remove PromotedAvatars import/render
- `src/components/effects/FeaturedArtistSlideshow.tsx` — switch data source to `useActiveAvatarPromotions`, add `/browse` route, change timing to 7s/3s
- `src/components/admin/AdminAvatarPromotions.tsx` — remove promotion_type and animation_type fields from form and list display

