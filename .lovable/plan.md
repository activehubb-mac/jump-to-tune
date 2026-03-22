

## AI Artist Drop — Implementation Plan

### Overview
A guided wizard flow that orchestrates existing Identity, Cover Art, and Release Builder systems into a single "drop" experience. One new page, one new edge function (song concept generator), one pricing entry. No existing systems modified.

---

### Pricing

**Add to `src/lib/aiPricing.ts`**:
```ts
artist_drop: {
  label: "AI Artist Drop",
  base: 40,
},
```

---

### New Edge Function: `supabase/functions/ai-artist-drop/index.ts`

Lightweight orchestrator that:
1. Authenticates user, deducts 40 credits atomically
2. Accepts `{ genre, mood, song_idea?, avatar_url?, visual_theme? }`
3. Calls Lovable AI (Gemini) to generate a song concept: title, description, tags, mood tags, cover art prompt, lyrics outline
4. Calls Gemini image generation to create cover art using the cover art prompt + identity context
5. Returns full package: `{ title, description, genre_tags, mood_tags, lyrics_outline, cover_image, avatar_url }`
6. On any failure after credit deduction, refunds credits via `add_ai_credits`

Does NOT call the existing `ai-release-builder` or `ai-cover-art` functions — it uses the same AI models directly to avoid double credit charges. Single 40-credit charge covers everything.

---

### New Page: `src/pages/AIArtistDrop.tsx`

Multi-step wizard with 4 screens:

**Step 1 — Input**:
- Genre selector (using `MAIN_GENRES` from `src/lib/genres.ts`)
- Mood/vibe text input
- Optional song idea textarea
- Toggle: "Use my artist identity" (auto-checked if `useDefaultIdentity` returns an identity)
- "Create My Drop — 40 credits" button

**Step 2 — Generating** (loading state):
- Progress animation showing stages: "Crafting concept...", "Generating artwork...", "Building release..."

**Step 3 — Result Screen**:
- Avatar (from identity or placeholder)
- Song title (editable)
- Cover art image
- Description
- Genre + mood tags
- Lyrics outline

**Step 4 — Next Actions**:
- "Create Music Video" → navigates to `/ai-video`
- "Generate Viral Clips" → navigates to `/ai-viral`
- "Save Project" → saves to a `drop_projects` concept (localStorage for now, no new DB table needed)
- "Start Over" → resets wizard

---

### Route

**`src/App.tsx`**: Add `<Route path="/ai-drop" element={<AIArtistDrop />} />`

---

### Entry Points

1. **AIToolsHub.tsx**: Add "AI Artist Drop" as a featured card at the top of the grid (with premium gold styling, similar to Video Studio). Roles: `["artist", "label"]`.

2. **ArtistDashboard.tsx**: Add a "Create My First Drop" CTA button in the Quick Actions section (below "Upload New Track"). Only show if user has no tracks yet OR always show as a quick action.

3. **Onboarding.tsx**: After onboarding completion, if role is artist, show a prompt/banner linking to `/ai-drop`.

---

### Files Changed

| File | Change |
|---|---|
| `src/lib/aiPricing.ts` | Add `artist_drop` pricing entry |
| `supabase/functions/ai-artist-drop/index.ts` | New edge function — concept + cover art orchestrator |
| `src/pages/AIArtistDrop.tsx` | New page — wizard flow |
| `src/App.tsx` | Add route `/ai-drop` |
| `src/pages/AIToolsHub.tsx` | Add AI Artist Drop card (top of grid, premium style) |
| `src/pages/ArtistDashboard.tsx` | Add "Create My First Drop" quick action button |

### Not Touched
- Identity Builder, Cover Art Generator, Video Studio, Viral Generator
- All existing edge functions
- Credit deduction logic (reuses existing `deduct_ai_credits` / `add_ai_credits`)
- Database schema (no new tables needed)

