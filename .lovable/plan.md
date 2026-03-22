

## Avatar Editing System — Implementation Plan

### Overview
Add version-based avatar editing to the Identity Builder. New DB table for versions, new pricing entries, new modal component, and an edge function extension. No changes to existing Identity Builder generation flow.

---

### Database Migration

**New table**: `identity_versions`
```sql
CREATE TABLE public.identity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES public.artist_identities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT NOT NULL,
  edit_mode TEXT NOT NULL CHECK (edit_mode IN ('quick', 'style', 'full')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.identity_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own versions" ON public.identity_versions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

Also add `parent_version_id UUID REFERENCES identity_versions(id)` nullable column to `artist_identities` for tracking lineage (optional FK, SET NULL on delete).

---

### Pricing (`src/lib/aiPricing.ts`)

Add new entry — no existing values changed:
```ts
avatar_edit: {
  label: "Avatar Editor",
  base: 10,
  tiers: [
    { label: "Quick Edit", credits: 10 },
    { label: "Style Shift", credits: 15 },
    { label: "Full Recreate", credits: 25 },
  ],
},
```

---

### Edge Function: `supabase/functions/ai-avatar-edit/index.ts`

New function (does NOT modify `ai-identity-builder`):
- Accepts `{ edit_mode, identity_id, accessories?, background?, output_style?, photo_base64?, preserve_likeness?, hd? }`
- Credit costs: quick=10, style=15, full=25
- **Quick Edit**: Fetches existing avatar from `artist_identities`, sends to Gemini image edit model with targeted prompt (change accessories/background only, preserve face)
- **Style Shift**: Fetches existing avatar, applies full style transformation prompt while preserving likeness
- **Full Recreate**: Reuses same logic as `ai-identity-builder` photo mode (or vision mode if no photo)
- On success: inserts row into `identity_versions`, returns new avatar
- On failure: refunds credits

---

### New Component: `src/components/ai/AvatarEditModal.tsx`

Modal with 3 tabs/cards for edit modes:
- **Quick Edit (10 cr)**: accessories input, background input, generate button
- **Style Shift (15 cr)**: output style dropdown (same 5 styles), generate button
- **Full Recreate (25 cr)**: photo upload + all options from existing photo mode, generate button

Shows current avatar as reference. After generation shows new vs. old side-by-side with:
- "Set as Profile" → updates `profiles.avatar_url` + `default_identity_id`
- "Save Version" → already saved during generation
- "Compare Versions" → opens version history

---

### New Component: `src/components/ai/AvatarVersionHistory.tsx`

Sheet/modal listing all versions for an identity:
- Shows thumbnails in chronological order
- Each version shows: avatar, edit mode badge, date
- "Set as Default" button per version → updates `profiles.default_identity_id` to parent identity + `profiles.avatar_url` to that version's URL

---

### Entry Points

1. **AIIdentityBuilder.tsx** (result actions): Add "Edit Avatar" button after save. Opens `AvatarEditModal` with `identityId={savedId}`.

2. **UserProfile.tsx / ArtistDashboard.tsx**: Add "Edit Avatar" button near profile avatar. Opens same modal with user's current `default_identity_id`.

---

### Hook: `src/hooks/useAvatarVersions.ts`

- `useQuery` fetches `identity_versions` for a given `identity_id`, ordered by `created_at DESC`
- Exposes `setVersionAsDefault(versionId)` which updates `profiles.avatar_url` from the version's URL

---

### Files Changed

| File | Change |
|---|---|
| New migration | Create `identity_versions` table |
| `src/lib/aiPricing.ts` | Add `avatar_edit` pricing entry |
| `supabase/functions/ai-avatar-edit/index.ts` | New edge function |
| `src/components/ai/AvatarEditModal.tsx` | New — edit modal with 3 modes |
| `src/components/ai/AvatarVersionHistory.tsx` | New — version browser |
| `src/hooks/useAvatarVersions.ts` | New — fetch/manage versions |
| `src/pages/AIIdentityBuilder.tsx` | Add "Edit Avatar" button in result actions |
| `src/integrations/supabase/types.ts` | Auto-updated by migration |

### Not Touched
- `ai-identity-builder` edge function (unchanged)
- Cover Art Generator, Video Studio, Viral Generator
- Existing `artist_identities` table structure
- All existing pricing values
- Credit deduction logic (`deduct_ai_credits` / `add_ai_credits`)

