

# JumTunes AI System — Full Audit Report

---

## SECTION 1 — GLOBAL PRICING CONFIG

**Source**: `src/lib/aiPricing.ts` (single source of truth)

```text
┌─────────────────────┬──────────┬─────────────────────────────────────────┐
│ Key                 │ Base     │ Tiers                                   │
├─────────────────────┼──────────┼─────────────────────────────────────────┤
│ playlist_builder    │ 5        │ (none)                                  │
│ release_builder     │ 10       │ (none)                                  │
│ cover_art           │ 10       │ (none)                                  │
│ identity_builder    │ 15       │ Vision: 15, Photo: 25, HD: 40           │
│ video_studio        │ 130      │ 10s/480p: 130, 15s/480p: 180,           │
│                     │          │ 20s/480p: 240, HD/720p: 400             │
│ viral_generator     │ 500      │ 3 Clips: 500, 5 Clips: 850             │
│ identity_motion     │ 0        │ Basic: 0, Video 10s: 130, HD: 400      │
└─────────────────────┴──────────┴─────────────────────────────────────────┘
```

**Note**: `identity_motion` is defined in the config but only consumed by the Identity Builder buttons — it maps to Video Studio pricing (not a separate deduction).

There is also a database table `ai_credit_costs` queried by `useAICredits`, but the frontend tools primarily use the hardcoded `aiPricing.ts` values.

---

## SECTION 2 — AI TOOLS HUB PAGE STRUCTURE

**Route**: `/ai-tools` — `src/pages/AIToolsHub.tsx`

**Display order** (top to bottom):

| # | Title | Description | Pricing Display | Hover Tiers | Premium | Roles |
|---|-------|-------------|-----------------|-------------|---------|-------|
| 1 | AI Video Studio | Generate cinematic AI music videos synced to your track | Starts at 130 | 10s/15s/20s/HD | Yes (gold glow + NEW badge) | artist, label |
| 2 | AI Viral Generator | Turn songs into TikTok, IG Reels & YouTube Shorts promo clips | Starts at 500 | 3 Clips / 5 Clips | No | artist, label |
| 3 | AI Playlist Builder | Describe a mood and AI creates a curated playlist | 5 credits | (none) | No | artist, label, fan |
| 4 | AI Release Builder | Generate cover art, titles, descriptions, and tags | 10 credits | (none) | No | artist, label |
| 5 | Cover Art Generator | Create stunning AI cover art | 10 credits | (none) | No | artist, label |
| 6 | AI Identity Builder | Generate identity from vision or photo | Starts at 15 | Vision/Photo/HD | No | artist, label |

**Header**: Shows credit count (bold number), progress bar (max 2000), "Buy Credits" button linking to `/wallet`. Non-hovered cards dim to 60% opacity.

---

## SECTION 3 — AI IDENTITY BUILDER FLOW

**Route**: `/ai-identity` — `src/pages/AIIdentityBuilder.tsx`

### Input Flow
Two tabs:
- **"From Vision"**: genre, vibe, inspiration, visual style, color palette, accessories — 15 credits
- **"From My Photo"**: photo upload (max 5MB), output style dropdown (Realistic/Futuristic/Animated/Cyberpunk/Luxury), likeness slider (Low/Medium/High), accessories, background style, HD toggle — 25 credits (40 for HD)

### Generation Process
- Opens `CreditConfirmModal` with cost + projected balance
- On confirm: calls `supabase.functions.invoke("ai-identity-builder")` with all params
- Backend deducts credits and returns: `name_suggestions[]`, `bio`, `visual_theme`, `tagline`, `avatar_image` (base64 or URL), `credits_used`, `credits_remaining`

### Output Actions (post-generation)
1. **Save Artist Identity** — uploads base64 to `avatars` storage bucket, inserts into `artist_identities` table with `settings: { motion_tier: "basic", motion_enabled: true, ... }`
2. **Set as Profile** — uploads to storage, updates `profiles.avatar_url`
3. **Regenerate** — clears result, re-triggers generation
4. **New Style** — cycles through output styles, clears result
5. **Use in Video** — navigates to `/ai-video` with URL params (no credits deducted)
6. **Create Video — 130 credits** — navigates to `/ai-video?motion_level=performance`
7. **HD Video — 400 credits** — navigates to `/ai-video?motion_level=cinematic` (auto-selects HD tier)

### Motion System
- `LiveAvatarPreview` component shows CSS-only animations: ken-burns zoom, breathing float, glow ring
- **No tier differentiation** — the component has no `tier` prop; all previews look identical regardless of motion_tier
- The "Create Video" and "HD Video" buttons just navigate to Video Studio — no credits are deducted here

### Storage
- `artist_identities` table: `id, user_id, avatar_url, name_suggestions, bio, visual_theme, tagline, settings (jsonb)`
- `settings.motion_tier` is stored as "basic" on save but never read back for visual differentiation

---

## SECTION 4 — AI VIDEO STUDIO FLOW

**Route**: `/ai-video` — `src/pages/AIVideoStudio.tsx`

### User Inputs
1. **Track** (optional) — dropdown of user's tracks
2. **Video Type** — Music Video, Lyric Video, Viral Clip, Avatar Performance
3. **Export Format** — 9:16, 16:9, 1:1
4. **Duration/Quality** — 10s/130cr, 15s/180cr, 20s/240cr, HD/400cr
5. **Style** — 8 presets (Cyberpunk, Anime, Luxury, etc.)
6. **Scene Prompt** — free text

### How Avatar/Identity is Passed
- **From URL params**: reads `avatar_url`, `style`, `identity_id`, `type`, `motion_level` from query string
- **From Saved Identities picker**: queries `artist_identities`, shows avatars in horizontal scroll, sets `avatarUrl` state on click
- `avatarUrl` is passed in the `generate()` call body

### Pricing Calculation
- Credit cost = `DURATION_OPTIONS[selected].credits` (130/180/240/400)
- Hardcoded in `useVideoStudio.ts`, matches `aiPricing.ts`

### Credit Deduction
- `CreditConfirmModal` shown before generation
- Credits deducted **server-side** in `ai-video-generator` edge function via `supabase.rpc("deduct_ai_credits")` BEFORE starting Replicate prediction
- If Replicate fails, credits are refunded via `supabase.rpc("add_ai_credits")`

### Cinematic Mode Behavior
- If `motion_level=cinematic` in URL params: auto-selects HD tier (-1 / 400 credits), shows "Cinematic mode" in identity banner

### Backend Model Selection
- If `avatar_url` exists → uses `minimax/video-01-live` (image-to-video) with `first_frame_image`
- If no avatar → uses `minimax/video-01` (text-to-video)
- Function returns immediately; `poll-video-job` handles async completion

### Playback
- Completed videos show inline `<video>` player
- If a track was selected, a hidden `<audio>` element syncs play/pause/seek with the video

---

## SECTION 5 — AI VIRAL GENERATOR FLOW

**Route**: `/ai-viral` — `src/pages/AIViralGenerator.tsx`

### Clip Pack Options
- 3 Clips — 500 credits
- 5 Clips — 850 credits
- Hardcoded in component (`CLIP_OPTIONS`), matches `aiPricing.ts`

### User Inputs
- Track (required), Format (TikTok/IG Reel/YT Short/Square), Clip Package, Visual Style (4 options)

### Generation
- `CreditConfirmModal` confirms cost
- Calls `supabase.functions.invoke("ai-viral-generator")` with `{ track_id, asset_type, duration_seconds: 10, style, clip_count }`
- Backend deducts credits, generates content (captions, hooks, hashtags, optional video)

### Identity/Avatar Usage
- **NOT connected** — no avatar_url or identity data is passed to the viral generator
- No reference to `useDefaultIdentity` or saved identities

---

## SECTION 6 — CREDIT SYSTEM

### Balance Display
- `useAICredits` hook queries `credit_wallets` table for `ai_credits` and `balance_cents`
- Displayed in every tool page header as a badge
- AI Tools Hub shows a progress bar (max 2000)

### Deduction Function
- Server-side: `supabase.rpc("deduct_ai_credits", { p_user_id, p_credits })` — returns `{ success, current_credits, new_credits }`
- Used by: `ai-video-generator`, `ai-identity-builder`, `ai-cover-art`, `ai-viral-generator`, etc.

### When Credits Are Deducted
- **Video Studio**: deducted BEFORE Replicate prediction starts (refunded on failure)
- **Identity Builder**: deducted inside the edge function during generation
- **Cover Art**: deducted inside the edge function
- **Viral Generator**: deducted inside the edge function

### Insufficient Credits Handling
- Frontend: `canAfford` check disables generate button + shows warning link to wallet
- `CreditConfirmModal`: disables confirm button if `remaining < 0`
- Backend: `deduct_ai_credits` returns `{ success: false }` → edge function returns 402

### Refund Mechanism
- Video Studio: refunds via `add_ai_credits` in catch block + logs negative usage to `ai_credit_usage`
- Identity Builder / Cover Art: similar pattern in their respective edge functions

---

## SECTION 7 — USER STATE / GLOBAL SETTINGS

### default_identity_id
- **Does NOT exist**. No column on `profiles`, no `global_settings` table, no hook for it. The "Apply Everywhere" feature was proposed but never implemented.

### motion_level
- Stored in `artist_identities.settings.motion_tier` as "basic" on save
- Never read back for visual differentiation — `LiveAvatarPreview` has no tier prop
- Only used as a URL param when navigating to Video Studio

### Artist Profile Linkage
- "Set as Profile" writes `avatar_url` directly to `profiles` table
- No `avatar_id` or `default_identity_id` foreign key on profiles
- Profile avatar and identity are not linked — changing one doesn't affect the other

### Other Global Config
- No user-level AI preferences stored
- No "Apply Everywhere" functionality exists

---

## SECTION 8 — KNOWN LIMITATIONS & GAPS

### Identity System
1. **No global identity** — `default_identity_id` does not exist; identity is not reusable across tools
2. **LiveAvatarPreview has no tiers** — all previews show identical CSS animation regardless of `motion_tier` setting
3. **motion_tier stored but never consumed** — saved as "basic" in settings, never read back
4. **"Set as Profile" and "Save Identity" are disconnected** — profile avatar has no FK to identity

### Tool Integration
5. **Viral Generator has no identity integration** — no avatar_url or style context is passed
6. **Cover Art Generator has no identity integration** — no auto-injection of avatar style
7. **Video Studio "Retry" doesn't pass avatar_url** — `handleRetry` omits `avatar_url` from params

### Pricing
8. **Dual pricing sources** — `aiPricing.ts` (frontend) and `ai_credit_costs` table (DB) exist independently; no enforcement that they match
9. **CreditConfirmModal says "deducted once generation completes"** but Video Studio actually deducts BEFORE generation starts (with refund on failure) — misleading copy

### Video Studio
10. **Silent video output** — Replicate models generate silent MP4s; audio sync is client-side only. Downloaded videos have no audio track.
11. **identity_motion pricing (0/130/400)** defined in aiPricing.ts but only the Identity Builder buttons reference it informally via navigation

### UI
12. **Three "Use in Video" buttons** on Identity Builder (Use in Video / Create Video — 130 / HD Video — 400) — confusing; "Use in Video" and "Create Video — 130" go to the same place with slightly different params
13. **Progress bar max hardcoded to 2000** regardless of subscription tier

