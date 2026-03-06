

# Add AI Cover Art Generation to Upload Page

## Problem
The AI tools (Cover Art Generator, Release Builder, etc.) exist as separate pages (`/ai-cover-art`, `/ai-release`, `/ai-tools`) but are not integrated into the actual track upload flow at `/upload`. Artists don't see any AI options when uploading.

## Solution
Add AI-powered buttons directly into the Upload page's cover art and track details sections:

1. **"Generate with AI" button** next to the Cover Art upload area -- opens a mini cover art generator inline or links to `/ai-cover-art` with a return flow
2. **"AI Release Builder" button** in the upload header -- links to `/ai-release` which already pre-fills the upload form
3. **Visual callout** making AI tools discoverable during the upload flow

## Files to Modify

### `src/pages/Upload.tsx`
- Add a "Generate Cover with AI" button below the `CoverArtUpload` component (around line 320) that either:
  - Links to `/ai-cover-art` (simplest, already built)
  - Or opens an inline modal that calls the `ai-cover-art` edge function and sets `coverFile` from the result
- Add an "AI Release Builder" button in the header section (around line 276) alongside the "Upload Album/EP" button
- Import `Sparkles` icon (already imported in other files)

### `src/components/upload/CoverArtUpload.tsx`
- Add an optional `onGenerateAI` callback prop
- Show a "Generate with AI" button in the empty/drop state, next to "Choose Image"

## Implementation Details

**Cover Art Upload area** -- Add a secondary button "Generate with AI ✨" that navigates to `/ai-cover-art`. The generated image from that page can be downloaded and uploaded manually for now, or we can add a callback flow.

**Header area** -- Add an "AI Release Builder" button next to "Upload Album/EP" that routes to `/ai-release`, which already generates titles, descriptions, tags, and cover art in one step.

**Inline generation (stretch)** -- Add a small inline prompt field + generate button directly in the cover art section that calls `ai-cover-art` and converts the base64 result to a File object, setting it as the cover.

## Approach
Start with the simple link-based integration (buttons that navigate to existing AI pages), then optionally add inline generation. This reuses all existing edge functions and pages.

