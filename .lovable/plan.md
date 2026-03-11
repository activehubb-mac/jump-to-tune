

## How Sing-Along Mode Currently Works

1. **Karaoke data** is stored in the `track_karaoke` table (instrumental URL + LRC lyrics) per track
2. When a track with `has_karaoke: true` plays, `GlobalAudioPlayer` fetches karaoke data via `useKaraokeData`
3. **Karaoke Mode toggle** (Mic icon) switches audio from original to instrumental
4. **Show Lyrics toggle** (separate Mic icon) opens the `KaraokeLyricsPanel` — a floating overlay that shows auto-scrolling, time-synced LRC lyrics
5. Both toggles live in `AudioPlayerContext` as `isKaraokeMode` and `showLyrics`

**The problem**: The `FullscreenPlayer` receives `showLyrics` and `toggleShowLyrics` as props but **never renders lyrics**. It also has no lyrics toggle button in its action row. When a user expands the player, lyrics disappear.

## Plan

### 1. Add lyrics display to FullscreenPlayer
**File**: `src/components/audio/FullscreenPlayer.tsx`

- Accept new prop `lyrics: string | null` (the raw LRC/plain text from karaokeData)
- When `showLyrics` is true, replace the cover art area with a `LyricsDisplay` component (from `src/components/sing-mode/LyricsDisplay.tsx`) that shows time-synced scrolling lyrics over a dimmed cover art background
- When `showLyrics` is false, show the normal cover art

### 2. Add lyrics toggle button to FullscreenPlayer action row
**File**: `src/components/audio/FullscreenPlayer.tsx`

- Add a lyrics toggle button (using the existing `Mic`/`MicOff` or a text icon like `Type`) in the action row next to the karaoke mode button
- Highlight it when `showLyrics` is active (gold `#B8A675` color)
- Only show when the track has karaoke data (lyrics available)

### 3. Pass lyrics data from GlobalAudioPlayer
**File**: `src/components/audio/GlobalAudioPlayer.tsx`

- Pass `karaokeData?.lyrics || null` as a new `lyrics` prop to `<FullscreenPlayer>`

### Files to modify
- `src/components/audio/FullscreenPlayer.tsx` — add lyrics overlay + toggle button
- `src/components/audio/GlobalAudioPlayer.tsx` — pass `lyrics` prop to FullscreenPlayer

