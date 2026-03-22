

## Stabilize & Connect JumTunes AI System

### Overview
7 targeted fixes to unify the AI system. No new features, no pricing changes, no breaking changes.

---

### Step 1 — Global Identity Persistence

**Migration**: Add `default_identity_id` column to `profiles` table:
```sql
ALTER TABLE public.profiles 
  ADD COLUMN default_identity_id UUID REFERENCES public.artist_identities(id) ON DELETE SET NULL;
```

**New hook** `src/hooks/useDefaultIdentity.ts`:
- Queries `profiles.default_identity_id`, then fetches the linked `artist_identities` row
- Returns `{ identityId, avatarUrl, settings, isLoading }`
- Exposes `setDefaultIdentity(identityId)` that updates `profiles.default_identity_id`

**Update `AIIdentityBuilder.tsx`**:
- "Set as Profile" button also saves `default_identity_id` to profiles (alongside `avatar_url`)
- If identity was saved first (`savedId` exists), use that; otherwise save identity first, then set

---

### Step 2 — Auto-Inject Identity Into Tools

**Cover Art Generator** (`src/pages/CoverArtGenerator.tsx`):
- Import `useDefaultIdentity`
- If `avatarUrl` exists, append to prompt: `"Incorporate the artist's visual identity and style into the artwork."`
- Pass `avatar_url` in the edge function body
- **Edge function** (`ai-cover-art`): read `avatar_url` from body, append to `fullPrompt` as style context — NOT as a pasted image, just as a text description enhancement. No structural change to generation.

**Video Studio** (`src/pages/AIVideoStudio.tsx`):
- Import `useDefaultIdentity`
- In the URL-params `useEffect`, if no `avatar_url` param AND `defaultIdentity.avatarUrl` exists, auto-set `avatarUrl` state
- User can still manually override by selecting a different identity

**Viral Generator** (`src/pages/AIViralGenerator.tsx` + `useViralGenerator.ts`):
- Import `useDefaultIdentity`
- Pass `avatar_url` and `visual_theme` in `generate()` body
- **Edge function** (`ai-viral-generator`): accept `avatar_url` and `visual_theme`, incorporate into the AI prompt for consistent identity across clips

---

### Step 3 — Fix Motion Tiers in LiveAvatarPreview

**Update `src/components/ai/LiveAvatarPreview.tsx`**:
- Add `motionTier?: "basic" | "performance" | "cinematic"` prop
- Apply different CSS classes per tier:
  - **basic**: `animate-avatar-breathe` only (subtle float)
  - **performance**: `animate-avatar-breathe` + `animate-avatar-glow` (breathing + glow)
  - **cinematic**: all animations + `animate-ken-burns` + depth shadow overlay

**Update `AIIdentityBuilder.tsx`**: Pass `motionTier` based on saved settings when displaying the preview.

---

### Step 4 — Fix Video Retry

**Update `src/pages/AIVideoStudio.tsx`** `handleRetry`:
```typescript
const handleRetry = (job: VideoJob) => {
  const jobAvatarUrl = (job.metadata as any)?.avatar_url || avatarUrl;
  generate({
    track_id: job.track_id,
    video_type: job.video_type,
    export_format: job.export_format,
    duration_seconds: job.duration_seconds,
    style: job.style,
    scene_prompt: job.scene_prompt || "",
    avatar_url: jobAvatarUrl || undefined,
  });
};
```

**Update `ai-video-generator` edge function**: Store `avatar_url` in job metadata so retry can recover it.

---

### Step 5 — Unify Pricing Source

The `ai_credit_costs` DB table is queried by `useAICredits` but the frontend tools use `aiPricing.ts` exclusively. No tool currently reads costs from the DB table for generation logic.

**Action**: Add a comment header to `aiPricing.ts` marking it as the canonical source. Remove the `costs` array and `getCost`/`canAfford` helpers from `useAICredits` that reference `ai_credit_costs` — they're unused by tools and create confusion. Keep the table for admin/analytics reference but stop querying it from the frontend hook.

---

### Step 6 — Fix CreditConfirmModal Copy

**Update `src/components/ai/CreditConfirmModal.tsx`**:
Change line:
```
"Credits will be deducted once generation completes successfully."
```
To:
```
"Credits are deducted before generation begins. Refunded automatically if generation fails."
```

---

### Step 7 — Clean Identity Builder Buttons

**Update `src/pages/AIIdentityBuilder.tsx`** action buttons section:
- Keep "Use in Video" (free navigation, no tier param)
- Keep "Create Video — 130 credits" (sets `motion_level=performance`)
- Keep "HD Video — 400 credits" (sets `motion_level=cinematic`)
- These are already the 3 buttons present. The audit noted them as "confusing" but the user explicitly wants to keep all 3. **Fix**: Make "Use in Video" label say "Preview in Video Studio" to differentiate it from the paid options. No other changes.

---

### Files Changed

| File | Change |
|---|---|
| New migration | Add `default_identity_id` to `profiles` |
| `src/hooks/useDefaultIdentity.ts` | New hook |
| `src/pages/AIIdentityBuilder.tsx` | Set `default_identity_id` on profile set, pass motionTier, rename button label |
| `src/components/ai/LiveAvatarPreview.tsx` | Add `motionTier` prop with tiered CSS |
| `src/pages/CoverArtGenerator.tsx` | Auto-inject identity context into prompt |
| `supabase/functions/ai-cover-art/index.ts` | Accept + use `avatar_url` as prompt context |
| `src/pages/AIVideoStudio.tsx` | Auto-load default identity, fix retry |
| `supabase/functions/ai-video-generator/index.ts` | Store `avatar_url` in job metadata |
| `src/pages/AIViralGenerator.tsx` | Pass identity to generate |
| `src/hooks/useViralGenerator.ts` | Add `avatar_url` + `visual_theme` to params |
| `supabase/functions/ai-viral-generator/index.ts` | Accept + use identity in prompt |
| `src/hooks/useAICredits.ts` | Remove `ai_credit_costs` query |
| `src/components/ai/CreditConfirmModal.tsx` | Fix copy |
| `src/lib/aiPricing.ts` | Add canonical source comment |

### Not Touched
- Cover Art generation model/quality (Gemini image gen unchanged)
- All pricing values
- Music player, artist store, payout systems
- Video generation pipeline (Replicate models)

