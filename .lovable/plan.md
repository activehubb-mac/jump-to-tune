

# Wire Go DJ Tab to the New Mix Builder System

## Problem
The Go DJ tab on `ArtistProfile.tsx` still uses the legacy session system (old `CreateSessionModal`, `SessionCard`, `useDJSessions`). The new Mix Builder with voice recording, timeline editing, and audio clip features is only accessible from the `/go-dj` discovery page. The artist profile -- which is where the user screenshot shows they are -- has no path to the Mix Builder.

## Solution
Update `ArtistProfile.tsx` to replace the old session creation flow with the new Mix Builder system, while keeping old sessions visible for backward compatibility.

## Changes

### `src/pages/ArtistProfile.tsx`

1. **Add new imports**: Import `MixWizard`, `MixSessionCard`, `useGoDJSessions`, `useGoDJProfile`/`useActivateGoDJ` (replacing old `useDJActivation`)
2. **Add state**: `showMixWizard` boolean for opening the new wizard
3. **Replace "New Session" button**: Change to open `MixWizard` instead of old `CreateSessionModal`. Update label to "+ New Session Mix"
4. **Add new sessions list**: Below the existing active/scheduled/archived sections, add a "Mix Sessions" section showing `go_dj_sessions` using `MixSessionCard` components. Draft sessions show "Continue Editing" and link to `/go-dj/mix/:id/edit`. Published sessions link to `/go-dj/mix/:id`
5. **Render `MixWizard`**: Add `<MixWizard open={showMixWizard} onOpenChange={setShowMixWizard} />` to the component
6. **Keep old sessions visible**: The legacy `dj_sessions` and their `SessionCard` components remain visible so existing sessions aren't lost. Over time these can be deprecated
7. **Wire activation**: Use `useGoDJProfile` + `useActivateGoDJ` to also create a `go_dj_profiles` row when activating (in addition to the existing activation), so the new system recognizes the DJ

### No other files need changes
The `MixWizard` already handles creating a draft `go_dj_session` and navigating to `/go-dj/mix/:sessionId/edit`, where the full Mix Builder with voice recording lives.

## Result
After this change, tapping "+ New Session Mix" on the Go DJ tab will open the Mix Wizard, which creates a draft and navigates to the Mix Builder page -- where the voice recorder, track picker, and timeline are all accessible.

