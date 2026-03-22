

## Simplify JumTunes AI Tools UX

Pure frontend cosmetic changes. No pricing, backend, or flow modifications.

---

### Step 1 — Standardize Pricing Labels

**File**: `src/pages/AIToolsHub.tsx` (lines 36, 47, 81)

Change `"Starts at X"` → `"From X"` for consistency:
- `Starts at ${AI_TOOL_PRICING.video_studio.base}` → `From ${AI_TOOL_PRICING.video_studio.base}`
- Same for `viral_generator` and `identity_builder`

---

### Step 2 — Update Tool Descriptions & Value Frames

**File**: `src/pages/AIToolsHub.tsx` (AI_TOOLS array)

Replace current `desc` values with clearer one-liners:
- Video Studio: "Create cinematic videos from your music"
- Viral Generator: "Turn your song into viral-ready clips"
- Playlist Builder: "Describe a mood and get a curated playlist"
- Release Builder: "Generate artwork, titles, and tags for your release"
- Cover Art: "Generate professional album artwork"
- Identity Builder: "Create your AI artist identity"

Remove `valueFrame` fields (redundant with improved descriptions).

---

### Step 3 — Show Active Identity Status

**File**: `src/pages/AIToolsHub.tsx`

Import `useDefaultIdentity`. Below the credit display (and before the tool grid), if `identityId` exists, show a small banner: avatar thumbnail + "Active Artist Identity Enabled" text. Non-intrusive, single line.

---

### Step 4 — Remove Progress Bar

**File**: `src/pages/AIToolsHub.tsx` (lines 121-124)

Remove the `<Progress>` component and `progressMax`/`progressPercent` variables. Keep the credit count and Buy Credits button.

---

### Step 5 — Add Dollar Equivalent to Credit Display

**File**: `src/pages/AIToolsHub.tsx` (line 112)

Below the credit count, add: `≈ $X.XX` calculated as `(aiCredits / 100).toFixed(2)`.

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/AIToolsHub.tsx` | Standardize labels, update descriptions, remove progress bar, add identity status banner, add dollar equivalent |

### Not Touched
- All pricing values in `aiPricing.ts`
- All backend edge functions
- All other pages
- Credit deduction logic

