

# Fix Go DJ Tab: Remove Duplicate Button and Add Draft Deletion

## Issues
1. **Extra "New Session" button**: There are two creation buttons side by side -- "New Session" (legacy) and "New Session Mix" (new). The legacy one should be removed since you're using the new Mix Builder system.
2. **No way to delete mix session drafts**: Legacy session cards have edit/delete icon overlays on hover, but the new `MixSessionCard` components have no delete option.

## Changes

### `src/pages/ArtistProfile.tsx`

**Remove the legacy "New Session" button** (lines 297-303):
- Remove the `Button` that opens `setShowCreateSession(true)` with label "+ New Session"
- Rename the remaining button from "+ New Session Mix" to just "+ New Session"
- Optionally remove the `CreateSessionModal` render block (lines 406-413) since it's no longer triggered, or keep it for any remaining legacy sessions that might need it

**Add delete functionality to mix session cards** (around lines 381-389):
- Wrap each `MixSessionCard` in a `relative group` div (same pattern as legacy cards)
- Add a delete icon button overlay (Trash2 icon) that appears on hover, visible only for `isOwnProfile`
- Wire the delete button to set a new `deleteMixSessionId` state
- Import and use `useDeleteGoDJSession` hook (already exported from `useGoDJSessions.ts`)
- Add a second `AlertDialog` (or reuse the existing one with a flag) for confirming mix session deletion

**New state and hook additions:**
- `const deleteMixSession = useDeleteGoDJSession();`
- `const [deleteMixSessionId, setDeleteMixSessionId] = useState<string | null>(null);`

### No other files need changes
- `MixSessionCard` component stays as-is (the delete overlay is added at the parent level, matching the legacy pattern)
- `useDeleteGoDJSession` hook already exists and handles cascade deletion

