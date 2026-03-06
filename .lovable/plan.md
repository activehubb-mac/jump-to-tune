

# Audit: What Already Exists vs. What's Requested

Most of the requested systems **already exist** in the codebase. Here's the breakdown:

## Already Implemented (No Changes Needed)
- AI Credit Wallet (`credit_wallets`, `useAICredits`, `deduct_ai_credits`, `add_ai_credits`)
- Credit Packs ($10/100, $40/500, $120/2000) + Starter Pack ($49) — in `Wallet.tsx`
- Free Trial: 50 credits on signup (`handle_new_user_wallet`), 30-day trial (`handle_new_user_subscription`)
- AI Release Builder (`/ai-release`, edge function `ai-release-builder`)
- Cover Art Generator (`/ai-cover-art`, edge function `ai-cover-art`)
- AI Identity Builder (`/ai-identity`, edge function `ai-identity-builder`)
- AI Video Generator (`/ai-video`, edge function `ai-video-generator`)
- AI Playlist Builder (`/ai-playlist`, edge function `ai-playlist-builder`)
- AI Tools Hub (`/ai-tools`)
- Prompt Studio tables (`track_prompts`)
- Promotion Marketplace tables (`promotion_slots`, `promotion_purchases`)
- Fan Vault (`/vault`)
- Store system (artist stores, Stripe Connect, 15% fee)
- AI Launch Cards (`ai-launch-card` edge function)
- Upload page with AI buttons (Cover Art + Release Builder)

## Gaps to Fill

### 1. Subscription Tiers Are Wrong
Current tiers are Fan/Artist/Label at $0.99/$4.99/$9.99 with no AI credits. Need to update to:
- **Creator** → $10/mo, 150 credits
- **Creator Pro** → $25/mo, 500 credits  
- **Label/Studio** → $79/mo, 2000 credits

This requires updating `Subscription.tsx` UI, creating new Stripe products/prices, and updating `create-checkout` price IDs.

### 2. Monthly Credit Refresh Not Implemented
No mechanism to add credits when a subscription renews. The `stripe-webhook` needs to handle `invoice.paid` to credit the user's wallet based on their tier.

### 3. AI Artist Business Engine Missing
No system generates a full "release kit" (social captions, promo visuals, marketing assets) after upload. Need a new edge function + UI.

### 4. Prompt Studio UI Missing
The `track_prompts` table exists but there's no UI on track pages to display/remix prompts.

### 5. Platform Playlists Admin UI Missing  
Admin can't create/manage official playlists from the dashboard.

### 6. DJ Mix Builder Credit Deduction
The Go DJ mix builder exists but doesn't deduct credits.

---

## Implementation Plan

### Step 1: Create Stripe Products & Prices
Use Stripe tools to create:
- **Products**: Creator ($10/mo), Creator Pro ($25/mo), Label/Studio ($79/mo)
- **Credit Packs**: Already exist but verify; add Starter Pack as a Stripe product
- Get the `price_xxx` IDs for each

### Step 2: Update Subscription Page
**File: `src/pages/Subscription.tsx`**
- Replace the `SUBSCRIPTION_TIERS` array with Creator/Pro/Label tiers showing monthly credit allotments
- Update price IDs in `create-checkout` edge function

### Step 3: Update `create-checkout` Edge Function
**File: `supabase/functions/create-checkout/index.ts`**
- Replace `SUBSCRIPTION_PRICES` with new price IDs from Step 1
- Add tier metadata for credit refresh logic

### Step 4: Add Monthly Credit Refresh to Webhook
**File: `supabase/functions/stripe-webhook/index.ts`**
- On `invoice.paid` for subscription renewals, call `add_ai_credits` based on tier:
  - Creator → 150, Pro → 500, Label → 2000

### Step 5: AI Business Engine Edge Function
**File: `supabase/functions/ai-business-engine/index.ts`** (new)
- Takes track metadata, generates social captions (Instagram, TikTok, X), marketing copy
- Cost: 3 credits
- Uses Lovable AI Gateway with `gemini-3-flash-preview`

### Step 6: Prompt Studio UI on Track Pages
**File: `src/components/audio/TrackCreditsSheet.tsx`** or track detail views
- Query `track_prompts` for the current track
- Display prompt chain (version history)
- "Remix This Prompt" button linking to AI Release Builder with pre-filled prompt

### Step 7: Platform Playlists Admin
**File: `src/pages/admin/AdminFeatured.tsx`**
- Add section for creating/managing platform playlists (Top AI Tracks, Trending, Top DJ Mixes)
- Uses existing `playlists` table with an `is_platform` flag (migration needed)

### Step 8: DJ Mix Credit Deduction
**File: `src/components/godj-mix/MixBuilder.tsx`**
- Deduct 5 credits when mix is exported/published via `deduct_ai_credits`

### Step 9: Update Dashboard Credit Display
**Files: `src/pages/ArtistDashboard.tsx`, `src/pages/FanDashboard.tsx`**
- Add credit balance widget with link to AI Tools and Wallet

### Database Migration
```sql
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_platform boolean DEFAULT false;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS platform_category text;
```

### Config Updates
- Add `ai-business-engine` to `supabase/config.toml`

This plan touches ~10 files and creates 1 new edge function. The bulk of the AI infrastructure is already built — this closes the gaps in subscriptions, credit refresh, and missing UI surfaces.

