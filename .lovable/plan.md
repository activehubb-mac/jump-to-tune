

# Fix Admin Homepage Sliders Not Responding to Drag

## Problem
The sliders on the Admin Homepage Controls page don't move when dragged. This is because they are fully controlled components (`value={[settings.xxx]}`) but only have `onValueCommit` (fires on release). Without an `onValueChange` handler, React re-renders the slider to its original position on every frame, making it appear stuck.

## Solution
Add local state for each slider value. Use `onValueChange` to update the local state (so the thumb moves visually during drag), and keep `onValueCommit` to save to the database when the user releases.

## Changes

### `src/pages/admin/AdminHome.tsx`

1. Add three `useState` hooks initialized from `settings`:
   - `newReleasesLimit` 
   - `trendingLimit`
   - `discoverArtistsLimit`

2. Sync local state when `settings` data changes (via `useEffect`)

3. For each Slider, update to:
   - `value={[localState]}` instead of `value={[settings.xxx]}`
   - Add `onValueChange={(v) => setLocalState(v[0])}` for live visual feedback
   - Keep `onValueCommit` to persist to database

4. Update the label text to show `localState` instead of `settings.xxx` so the number updates live during drag

No other files need changes. The Slider component itself is fine -- `touch-none` is standard Radix behavior that prevents scroll interference during drag.
