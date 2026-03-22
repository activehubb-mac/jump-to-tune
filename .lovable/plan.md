

## Two-Part Upgrade: AI Identity Builder Photo Mode + Credit Pricing Fix

### Feature 1: AI Identity Builder — Two-Mode System

**Frontend: `src/pages/AIIdentityBuilder.tsx`** — Full rewrite

Add tab-based mode switcher at top of the input card:

- **Mode A: "Start from Vision"** — existing flow with added fields (visual style, color palette, accessories)
- **Mode B: "Start from My Photo"** — new photo upload flow

Mode B UI:
- File upload zone (accept image/jpeg, image/png, image/webp; max 5MB)
- Output style selector: Realistic Artist Portrait / Futuristic / Animated / Cyberpunk / Luxury Editorial
- Preserve likeness slider: Low / Medium / High
- Optional fields: accessories, background style
- Pricing display: "Photo recreate: 25 credits" / "HD recreate: 40 credits" toggle

Post-generation action buttons (both modes):
- Regenerate same style
- New style
- New pose
- Use in Video (links to /ai-video)

Dynamic cost based on mode:
- Vision: 15 credits
- Photo recreate: 25 credits
- HD recreate: 40 credits

Wire `CreditConfirmModal` before generation in both modes.

**Edge function: `supabase/functions/ai-identity-builder/index.ts`** — Update

- Accept new fields: `mode` ("vision" | "photo"), `photo_base64`, `output_style`, `preserve_likeness`, `hd`, `visual_style`, `color_palette`, `accessories`, `background_style`
- Dynamic credit cost: vision=15, photo=25, hd_photo=40
- Mode A (vision): keep existing flow, enhance prompt with new fields
- Mode B (photo): use `google/gemini-2.5-flash-image` edit-image endpoint — send the uploaded photo with a style transformation prompt. The prompt incorporates output_style, preserve_likeness level, accessories, and background_style
- HD mode: use `google/gemini-3-pro-image-preview` for higher quality output
- Refund credits on failure (existing pattern)

---

### Feature 2: Centralized Credit Pricing Display

**New file: `src/lib/aiPricing.ts`** — Single source of truth

```typescript
export const AI_TOOL_PRICING = {
  playlist_builder: { label: "AI Playlist Builder", base: 5 },
  release_builder: { label: "AI Release Builder", base: 10 },
  cover_art: { label: "Cover Art Generator", base: 10 },
  identity_builder: {
    label: "AI Identity Builder",
    base: 15,
    tiers: [
      { label: "Vision mode", credits: 15 },
      { label: "Photo recreate", credits: 25 },
      { label: "HD recreate", credits: 40 },
    ],
  },
  video_studio: {
    label: "AI Video Studio",
    base: 130,
    tiers: [
      { label: "10s (480p)", credits: 130 },
      { label: "15s (480p)", credits: 180 },
      { label: "20s (480p)", credits: 240 },
      { label: "HD (720p)", credits: 400 },
    ],
  },
  viral_generator: {
    label: "AI Viral Generator",
    base: 500,
    tiers: [
      { label: "3 Clips", credits: 500 },
      { label: "5 Clips", credits: 850 },
    ],
  },
};
```

**Update `src/pages/AIToolsHub.tsx`**
- Import from `aiPricing.ts` instead of hardcoding credits in the `AI_TOOLS` array
- AI Identity Builder card: update description to mention photo upload, add pricing tiers, show "Starts at 15 credits"
- Remove USD equivalent display (per user request: "remove any visible dollar conversion")

**Update individual tool pages to use centralized pricing:**

- `src/pages/AIPlaylistBuilder.tsx` — change `const cost = 3` to `const cost = 5` (from pricing config)
- `src/pages/AIIdentityBuilder.tsx` — already being rewritten, will use 15/25/40
- `src/pages/AIReleaseBuilder.tsx` — keep `getCost("release_builder") || 10` (update fallback from 5 to 10)

**Not touched (per protection rules):**
- `src/pages/CoverArtGenerator.tsx` — no changes to its generation logic, cost, or UI behavior
- `supabase/functions/ai-cover-art/index.ts` — completely untouched

---

### Files Changed

| File | Change |
|---|---|
| `src/lib/aiPricing.ts` | **New** — centralized pricing config |
| `src/pages/AIIdentityBuilder.tsx` | Rewrite — two-mode system with photo upload |
| `supabase/functions/ai-identity-builder/index.ts` | Update — photo mode, dynamic costs, new fields |
| `src/pages/AIToolsHub.tsx` | Update — use centralized pricing, remove USD display, update Identity Builder card |
| `src/pages/AIPlaylistBuilder.tsx` | Fix cost from 3 to 5 |
| `src/pages/AIReleaseBuilder.tsx` | Fix fallback cost from 5 to 10 |

