

## Allow Direct Avatar Upload for AI Tools

### Problem
Artists who already have their own avatar/photo can only use AI-generated identities in the Video Studio, Viral Generator, and other tools. There's no way to upload a custom image directly — they're forced through the Identity Builder first.

### Solution
Add an "Upload Your Own" option alongside the existing Saved Identities picker in the Video Studio. This uses the existing `avatars` storage bucket and requires zero backend changes.

---

### Changes

**File: `src/pages/AIVideoStudio.tsx`**

In the "Saved Identities" card (lines 357-434), add an "Upload Image" button at the start of the identity row:

- Small upload button (same size as identity avatars) with a `+` / Upload icon
- Hidden file input accepting `image/jpeg,image/png,image/webp`
- On file select:
  1. Upload to `avatars` bucket under `{userId}/video-{timestamp}.{ext}`
  2. Get public URL
  3. Set `avatarUrl` state to the uploaded URL
  4. Set `identityBanner` to "Using your uploaded image"
  5. Auto-select `avatar_performance` video type
- Show the uploaded image as a selected avatar thumbnail in the row
- Max 5MB validation, same as existing `useAvatarUpload`

Also add the same upload option to:

**File: `src/pages/AIViralGenerator.tsx`**
- Add an "Upload Image" button in the avatar/identity section so artists can use their own image for viral clips

**File: `src/pages/CoverArtGenerator.tsx`**
- Add upload option for reference image input

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/AIVideoStudio.tsx` | Add "Upload Your Own" button in Saved Identities picker |
| `src/pages/AIViralGenerator.tsx` | Add "Upload Image" option for custom avatar |
| `src/pages/CoverArtGenerator.tsx` | Add "Upload Image" option for reference art |

### Not Touched
- Identity Builder, avatar editing, credit system, edge functions
- `useAvatarUpload` hook (profile-specific, not reused here — inline upload logic instead)
- Storage buckets (reuses existing `avatars` bucket)

