

## Add "Saved Identities" Picker to AI Video Studio

### Problem
Once an artist saves an identity, there's no way to load it into the Video Studio without going back to the Identity Builder and regenerating. The "Use in Video" flow only works immediately after generation.

### Solution
Add a "Saved Identities" section to the Video Studio that fetches from `artist_identities` and lets users pick one to pre-load their avatar and style into the video generation form.

### Changes

#### 1. `src/pages/AIVideoStudio.tsx` — Add Saved Identities picker

Between the header and Step 1 (Track), add a new card:
- Query `artist_identities` for `user_id = auth.uid()`, ordered by `created_at desc`, limit 10
- Show each as a small clickable card with avatar thumbnail, visual theme, and date
- On click: set `scenePrompt` to include the identity's style/theme, set `videoType` to `avatar_performance`, set `style` from identity settings, show the identity banner, store `identityId`
- If no saved identities, show a subtle link: "Create your first identity →" linking to `/ai-identity`

#### 2. No other files changed
- No database changes needed — `artist_identities` table already exists with proper RLS
- No edge function changes — the Video Studio already generates videos from prompts

### Files

| File | Change |
|---|---|
| `src/pages/AIVideoStudio.tsx` | Add saved identities query + picker UI between header and Step 1 |

