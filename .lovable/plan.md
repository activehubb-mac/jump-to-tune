

# Fix Preview Ended Modal - Price Not Being Passed

## Problem
The "Preview Ended" modal shows $0.00 because the `price` field is never being passed to `playTrack` or hydrated afterward.

## Root Cause Analysis

The data flow has three gaps:

1. **Call sites don't include `price`**: When `playTrack()` is called from pages like `Browse.tsx`, the price is not included in the track object

2. **Hydration doesn't fetch `price`**: The `hydrateTrackAsync` function in `AudioPlayerContext.tsx` only fetches `audio_url, has_karaoke, preview_duration` - it does not fetch `price`

3. **GlobalAudioPlayer defaults to 0**: When passing the track to `PreviewEndedModal`, it uses `currentTrack.price || 0`, which is always 0 since price was never set

## Solution

Two-part fix:

### Part 1: Include `price` in hydration query

In `AudioPlayerContext.tsx`, update the database query to also fetch `price`:

```tsx
// Line ~637: Update the select query
.select("audio_url, has_karaoke, preview_duration, price")

// Line ~650-655: Update the state setter to include price
setCurrentTrack(prev => prev?.id === track.id ? {
  ...prev,
  has_karaoke: hasKaraoke,
  preview_duration: previewDuration || DEFAULT_PREVIEW_LIMIT_SECONDS,
  price: data?.price ?? prev.price,  // Add this line
} : prev);
```

Also update the fallback fetch path (~line 704-720):
```tsx
.select("audio_url, has_karaoke, preview_duration, price")
// And include price in hydratedTrack
```

### Part 2: Ensure all `playTrack` call sites include `price`

Update all locations that call `playTrack()` to include the `price` field. Key files:
- `src/pages/Browse.tsx`
- `src/pages/AlbumDetail.tsx`
- `src/pages/ForYou.tsx`
- `src/pages/LikedSongsDetail.tsx`
- `src/pages/Karaoke.tsx`
- `src/pages/LabelProfile.tsx`
- `src/components/dashboard/TrackCard.tsx`
- `src/components/browse/AlbumCard.tsx`
- `src/components/browse/RecentlyViewedSection.tsx`
- `src/components/home/FeaturedHeroCarousel.tsx`
- `src/components/library/OwnedTrackCard.tsx`
- `src/components/library/RecentlyPlayedCarousel.tsx`

Example fix for `Browse.tsx`:
```tsx
playTrack({
  id: track.id,
  title: track.title,
  audio_url: track.audio_url,
  cover_art_url: track.cover_art_url,
  duration: track.duration,
  artist: track.artist,
  price: track.price,  // Add this line
});
```

## Files to Modify

| File | Change |
|------|--------|
| `src/contexts/AudioPlayerContext.tsx` | Add `price` to hydration queries and state updates |
| `src/pages/Browse.tsx` | Include `price` in `playTrack()` call |
| `src/pages/AlbumDetail.tsx` | Include `price` in `playTrack()` calls |
| `src/pages/ForYou.tsx` | Include `price` in `playTrack()` calls |
| `src/pages/LikedSongsDetail.tsx` | Include `price` in `playTrack()` calls |
| `src/pages/Karaoke.tsx` | Include `price` in `playTrack()` call |
| `src/pages/LabelProfile.tsx` | Include `price` in `playTrack()` call |
| `src/components/dashboard/TrackCard.tsx` | Include `price` in `playTrack()` call |
| `src/components/browse/AlbumCard.tsx` | Include `price` in `playTrack()` call |
| `src/components/browse/RecentlyViewedSection.tsx` | Include `price` in `playTrack()` call |
| `src/components/home/FeaturedHeroCarousel.tsx` | Include `price` in `playTrack()` call |
| `src/components/library/OwnedTrackCard.tsx` | Include `price` in `playTrack()` call |
| `src/components/library/RecentlyPlayedCarousel.tsx` | Include `price` in `playTrack()` call |

## Technical Notes

- The `price` field is stored in the database as a `numeric` type in dollars (e.g., `0.25` = $0.25)
- The `PreviewEndedModal` already uses `formatPrice(track.price)` which will correctly format the raw value as `$0.25`
- No changes needed in `PreviewEndedModal.tsx` - the current code is correct once it receives the actual price value

