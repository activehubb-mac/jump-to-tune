

# Fix 400 Errors: profiles_public Foreign Key Join Issue

## Problem Summary

Multiple pages are showing 400 errors in the console because they're trying to use Supabase's foreign key join syntax (`!table_fkey`) with `profiles_public`, which is a **VIEW** (not a table). Views don't support foreign key constraints, causing Supabase to reject these requests.

## Root Cause

The `profiles_public` is a VIEW that exposes safe public fields from the `profiles` table. The actual foreign keys (`albums_artist_id_fkey`, `tracks_artist_id_fkey`) point to `auth.users`, not to any profile table.

When you write:
```typescript
artist:profiles_public!albums_artist_id_fkey(id, display_name)
```

Supabase looks for a foreign key named `albums_artist_id_fkey` that references `profiles_public` - but it doesn't exist, so it returns 400.

## Solution

Refactor the affected queries to use a two-step fetch pattern (like `useTracks.ts` already does correctly):

1. Fetch the primary data (albums/tracks)
2. Collect unique `artist_id` values
3. Fetch artist profiles separately from `profiles_public` using `.in("id", artistIds)`
4. Merge the results client-side

This is the same pattern used successfully in `useTracks.ts` and `useFeaturedContent.ts`.

## Files to Modify

| File | Current Issue | Fix |
|------|--------------|-----|
| `src/pages/Browse.tsx` | Line 181-184: Uses `!albums_artist_id_fkey` join | Refactor to fetch albums first, then profiles separately |
| `src/pages/admin/AdminFeatured.tsx` | Line 82-85: Same issue | Same fix |
| `src/components/browse/AlbumCard.tsx` | Line 34-37: Uses `!tracks_artist_id_fkey` join | Same fix |

## Implementation Details

### Browse.tsx - Albums Query

Current (broken):
```typescript
const { data, error } = await supabase
  .from("albums")
  .select(`
    id, title, cover_art_url, release_type, genre, total_price,
    artist:profiles_public!albums_artist_id_fkey(id, display_name, avatar_url)
  `)
```

Fixed:
```typescript
// Step 1: Fetch albums without join
const { data: albumsData, error } = await supabase
  .from("albums")
  .select("id, title, cover_art_url, release_type, genre, total_price, artist_id")
  .eq("is_draft", false)
  .order("created_at", { ascending: false })
  .limit(10);

if (error) throw error;
if (!albumsData || albumsData.length === 0) return [];

// Step 2: Get unique artist IDs
const artistIds = [...new Set(albumsData.map(a => a.artist_id).filter(Boolean))];

// Step 3: Fetch artist profiles
const { data: artists } = await supabase
  .from("profiles_public")
  .select("id, display_name, avatar_url")
  .in("id", artistIds);

// Step 4: Map artists to albums
const artistMap = new Map(artists?.map(a => [a.id, a]) || []);
return albumsData.map(album => ({
  ...album,
  artist: artistMap.get(album.artist_id) || null
}));
```

### AlbumCard.tsx - Tracks Query

Same pattern - fetch tracks first, then artist profiles separately.

### AdminFeatured.tsx - Albums Query

Same pattern - already have a reference implementation in `useFeaturedAlbums`.

## Regarding Re-implementing Reverted Features

The 37 reverted features are **safe to re-implement** because:

1. **Audio fixes are preserved**: The Safari audio fixes we just implemented are in `AudioPlayerContext.tsx`, which is the current working version

2. **Reverted features are UI/UX focused**: Things like:
   - Library UI and interactions
   - Haptic feedback
   - Download UI
   - Pin functionality
   - iOS safe area scrolling
   - Theme updates

   These don't touch the core audio playback logic.

3. **The audio-related reverts were replaced**: The old "Fix iOS audio" commits had the problematic unlock logic - we've now replaced that with a cleaner implementation using:
   - Separate throwaway Audio element for unlocking
   - Play request token pattern
   - Safari AbortError recovery
   - Stalled playback watchdog

## Summary

- Fix the 3 files with bad foreign key joins (quick fix)
- Then you can safely proceed to re-implement the reverted features
- The Safari audio fix will remain stable

