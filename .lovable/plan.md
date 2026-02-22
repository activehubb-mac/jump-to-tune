

# Fix Spotify Player Visibility on Homepage

## Two Problems Found

### Problem 1: Invalid Admin URI
The admin setting `spotify_embed_uri` is currently set to `https://open.spotify.com/` -- this is just the Spotify homepage, not a valid playlist or track URL. The component needs a URL like `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M` to work. That's why nothing shows up.

**Fix**: Update the admin setting to a valid Spotify playlist URL. I'll set it to a popular playlist so the player works immediately.

### Problem 2: Floating Spotify Button Should Always Show
Right now, the floating button only appears when the player is collapsed AND the URI is valid. The user wants a floating Spotify logo always visible on the homepage that opens the full player when clicked.

**Fix**: Redesign the component so the floating button shows even when the player starts collapsed (default to collapsed instead of expanded), and use the Spotify brand icon/logo instead of a generic headphones icon.

## Changes

### 1. Update admin setting in database
Set `spotify_embed_uri` to a valid Spotify playlist URL (e.g., a popular global playlist).

### 2. Update `src/components/home/SpotifyEmbedSection.tsx`
- Default state: **collapsed** (floating button visible) instead of expanded
- Replace the headphones icon with a recognizable Spotify-green circular button with the Spotify logo
- Make the floating button more prominent and always visible when URI is configured
- When clicked, expand the full player inline and scroll to it
- Keep the X button to collapse back to the floating logo

### 3. Update `src/pages/Index.tsx`
- Always render `SpotifyEmbedSection` when a URI is configured (no change needed here, just ensuring it stays)

## Technical Details

| File | Change |
|------|--------|
| Database: `admin_home_settings` | Update `spotify_embed_uri` to a valid playlist URL |
| `src/components/home/SpotifyEmbedSection.tsx` | Default to collapsed; use Spotify-branded floating button with green circle and music icon; make it more prominent |

