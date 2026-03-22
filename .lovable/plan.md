

## Enhance Global Identity System

Small, targeted changes. No pricing/generation/UI flow modifications.

---

### 1. Extend `useDefaultIdentity` hook

**File**: `src/hooks/useDefaultIdentity.ts`

Add `bio` and `artistName` (from `name_suggestions[0]`) to the query and return value:

```ts
// Select expands to include bio, name_suggestions
.select("id, avatar_url, visual_theme, settings, bio, name_suggestions")

// Return adds:
artistName: identity.name_suggestions?.[0] ?? null,
bio: identity.bio ?? null,
```

---

### 2. Auto-set default identity on save (not just "Set as Profile")

**File**: `src/pages/AIIdentityBuilder.tsx`

In `handleSave` (around line 214), after `setSavedId(inserted.id)`, call:
```ts
await setDefaultIdentity(inserted.id);
```

This means every new identity automatically becomes the default. User can still switch via version history.

---

### 3. Auto-set after avatar edit completion

**File**: `src/components/ai/AvatarEditModal.tsx`

After a successful edit generation (where the new version is saved), auto-call `setDefaultIdentity(identityId)` — this already happens in the "Set as Profile" handler but NOT after the generation itself. Add it to the generation success path so the edited version's parent identity stays the default.

---

### Files Changed

| File | Change |
|---|---|
| `src/hooks/useDefaultIdentity.ts` | Add `artistName` and `bio` to query & return |
| `src/pages/AIIdentityBuilder.tsx` | Auto-set default identity on save |
| `src/components/ai/AvatarEditModal.tsx` | Auto-set default identity after edit generation |

### Not Touched
- All pricing values and logic
- Video Studio, Cover Art, Viral Generator (already consume `useDefaultIdentity`)
- Backend edge functions
- UI flows and layouts

