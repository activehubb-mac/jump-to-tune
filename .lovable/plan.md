

## AI Identity Builder Final Form + Pricing Fixes

### Database: New `artist_identities` Table

Create a migration for storing saved identities:

```sql
CREATE TABLE public.artist_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url text,
  reference_photo_url text,
  name_suggestions text[],
  bio text,
  visual_theme text,
  tagline text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.artist_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own identities"
  ON public.artist_identities FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Settings JSONB stores: mode, output_style, preserve_likeness, accessories, background_style, genre, vibe, etc.

---

### File Changes

#### 1. `src/pages/AIIdentityBuilder.tsx` — Enhance Results Section

**Save Artist Identity button:**
- After successful generation, show "Save Artist Identity" button
- On click: upload avatar image to `avatars` bucket, optionally upload reference photo, then insert row into `artist_identities`
- Show success toast

**Artist Profile Preview section:**
- After generation, render a mock profile card showing:
  - Avatar image
  - First name suggestion (or "Your Artist Name")
  - Bio text
  - Visual theme
  - Tagline
- Styled as a realistic profile preview card

**Keep existing action buttons** (Regenerate, New Style, Use in Video)

**"Use in Video" enhancement:**
- Instead of plain link to `/ai-video`, navigate with query params: `?avatar_url=...&style=...`
- Pass the generated avatar base64/URL and style config

#### 2. `src/pages/AIVideoStudio.tsx` — Accept Identity Params

- Read `avatar_url` and `style` from URL search params on mount
- If present, pre-fill the prompt with identity context (e.g., "Artist avatar performance video in [style] style")
- Show a small banner: "Using your AI Identity avatar"

#### 3. `supabase/functions/ai-identity-builder/index.ts` — Prompt Quality Boost

Enhance the photo mode prompt by appending:
- "editorial photography lighting, music industry branding, album-ready composition, realistic lighting balance"

Do NOT change the structure — only append quality modifiers to the existing `editPrompt` string. Same for vision mode's avatar_prompt instruction.

#### 4. `src/components/wallet/CreditBalanceChip.tsx` — Remove Dollar Display

Change line 42 from:
```
{aiCredits} credits <span ...>≈ ${(aiCredits / 100).toFixed(2)}</span>
```
To:
```
{aiCredits} credits
```

#### 5. `src/pages/AITool