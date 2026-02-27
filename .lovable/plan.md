

# Improve Voice Recording Discoverability in Mix Builder

## Problem
The current voice recording flow in the Go DJ Mix Builder is a multi-step process that isn't immediately obvious:
1. You must first **Record** and **Save** a voice clip in the "Record a Drop" section (left panel).
2. Only then does an "Insert Voice to Timeline" section appear below with a **+** button to actually place it on the timeline.

This two-step flow is confusing -- the "Insert Voice to Timeline" section is hidden until clips exist, and saving a clip doesn't automatically add it.

## Proposed Changes

### 1. Auto-insert voice clip to timeline after saving
When a DJ records and saves a voice clip, automatically add it as a voice segment at the end of the timeline. This eliminates the second manual "insert" step entirely. A toast will confirm: "Voice clip saved and added to timeline."

### 2. Always show the "Insert Voice to Timeline" section
Show this section even when no clips exist yet, with helper text like "Record a voice drop above, then insert it here" so DJs know the flow upfront.

### 3. Add a visible "Record a Drop" prompt in the empty timeline
When the timeline is empty, update the placeholder text from just "Add tracks and voice clips to build your mix" to include an explicit mention: "Search for tracks on the left, or record a voice drop to get started."

### 4. Add a quick-record button directly in the timeline area
Add a small "+ Voice Drop" button at the bottom of the timeline (next to the segments) that scrolls to / highlights the voice recorder panel. This gives DJs a second entry point to discover the recording feature.

## Files Modified

### `src/components/godj-mix/MixBuilder.tsx`
- After `handleSave` succeeds in `VoiceRecorder`, auto-call `handleAddVoiceClip` with the new clip ID
- Pass an `onClipSaved` callback prop to `VoiceRecorder`
- Always render the "Insert Voice to Timeline" section (with empty state text when no clips)
- Add a "+ Voice Drop" shortcut button at the bottom of the timeline
- Update empty timeline placeholder text

### `src/components/godj-mix/VoiceRecorder.tsx`
- Add `onClipSaved?: (clipId: string) => void` prop
- Call `onClipSaved` after successful save, passing the new clip's ID
- This lets the parent (`MixBuilder`) auto-insert the clip into the timeline

## Technical Details

- `VoiceRecorder` already returns the saved clip data from `uploadClip.mutateAsync()` which includes the clip `id`
- `MixBuilder` already has `handleAddVoiceClip(clipId)` that inserts a voice segment
- The change is simply wiring these together via a callback prop
- No database or schema changes needed
- No changes to the existing JumTunes player

