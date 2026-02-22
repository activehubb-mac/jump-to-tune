

# User-Controllable Spotify Player on Home Screen

## Overview
Add a toggleable Spotify player widget on the home screen that any user (logged in or guest) can show/hide. The player stays visible while browsing the homepage and remembers the user's preference via localStorage.

## What Changes

### 1. Update SpotifyEmbedSection Component
Modify `src/components/home/SpotifyEmbedSection.tsx` to include:
- A visible toggle/close button (X icon) in the header to collapse the player
- A "minimize" state that shows a small "Open Spotify Player" bar when toggled off
- localStorage persistence for the toggle state (`jumtunes_spotify_player_visible`)
- Compact height on mobile (152px for single track, 352px for playlist)

### 2. Add a Floating "Spotify" Mini-Button
When the player is toggled off, show a small sticky floating pill/button at the bottom of the homepage (above the JumTunes mini-player if present) that says "Spotify" with a music icon. Tapping it re-opens the embed section and scrolls to it.

This will be built directly into the `SpotifyEmbedSection` component as two render states (expanded vs collapsed pill).

### 3. Homepage Integration
Update `src/pages/Index.tsx`:
- Move the Spotify embed to a more prominent position (after the hero/featured sections, before New Releases)
- Always render the section when an admin URI is configured -- the user toggle controls visibility of the iframe itself

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/components/home/SpotifyEmbedSection.tsx` | Add toggle button, collapsed state, localStorage persistence, floating re-open pill |
| `src/pages/Index.tsx` | Reposition Spotify section higher on page |

### No database changes needed
Toggle state is stored in localStorage per device -- no user-specific DB column required.

### Toggle Behavior
- Default: Player is **shown** (expanded) when admin has set a URI
- User clicks X/toggle: Player collapses to a small pill "Listen on Spotify"
- User clicks pill: Player re-expands
- Preference remembered across page reloads via localStorage
- Works for both logged-in users and guests

