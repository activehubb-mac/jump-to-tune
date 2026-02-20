

# Fix: Social Links Not Showing on "Find Me" Tab

## Problem

When you add social media links in "Edit Profile", they save to the database correctly, but they never appear on the "Find Me Everywhere" tab. The root cause is in the `useArtistProfile` hook -- it fetches the data from the database but then drops it when building the return object.

## What Needs to Change

### 1. Update `src/hooks/useArtistProfile.ts`

- Add `social_links` to the `ArtistProfile` TypeScript interface
- Include `social_links` in the returned object (it's already fetched, just not passed through)

### 2. Remove the `(artist as any)` cast in `src/pages/ArtistProfile.tsx`

- Line 332 currently uses `(artist as any).social_links` as a workaround
- Once the hook properly returns `social_links`, this cast becomes unnecessary and can be replaced with `artist.social_links`

## Technical Details

The hook already does `select("*")` on `profiles_public`, which includes `social_links`. The data exists in `profile.social_links` but is never mapped into the return value (lines 66-78 of `useArtistProfile.ts`). Adding one line to the interface and one to the return object fixes the entire flow.

No database changes needed -- the `social_links` column already exists in `profiles` and is exposed through `profiles_public`.

