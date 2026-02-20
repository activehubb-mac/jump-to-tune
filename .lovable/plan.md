

# JumTunes Platform Enhancement Plan

This plan enhances the existing platform with pay-per-message credits, a Superfan chat room, social links ("Find Me Everywhere"), locked profile tab order, content visibility controls, download attempt limiting, and AI-ready backend flags -- all layered on top of the existing Store, Superfan, Vault, and loyalty systems.

---

## What Already Exists (No Changes Needed)

The following features from the request are already fully implemented:

- **Artist Store System** with Stripe Connect, 85/15 split, seller agreement, product types, orders, analytics
- **Superfan Membership** with subscription checkout, gated content, badges
- **Fan Vault** with digital collection, limited editions, loyalty levels, order history
- **Superfan Loyalty/Leveling** with points engine, 5 tiers, AI insights
- **Activity Feed** on artist profile
- **Direct Messages** (currently subscription-gated, will be enhanced with credits)
- **Existing wallet system** (credits wallet for track purchases)

---

## Phase 1: Database Changes

### 1A. New table: `message_credits`

Tracks per-fan message credit balance and artist-specific pricing/controls.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| fan_id | uuid | references profiles |
| balance | integer | default 0, credits remaining |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 1B. New table: `message_threads`

One active thread per fan-artist pair. Enforces "one open message at a time."

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| fan_id | uuid | |
| artist_id | uuid | |
| status | text | 'open', 'replied', 'expired', 'closed' |
| credit_cost | integer | credits deducted for this message |
| message | text | fan's message |
| reply | text | nullable, artist's reply |
| sent_at | timestamptz | when fan sent |
| replied_at | timestamptz | nullable |
| expires_at | timestamptz | sent_at + 72 hours |
| refunded | boolean | default false |
| created_at | timestamptz | |

Unique constraint on `(fan_id, artist_id)` where `status = 'open'` enforced via application logic.

### 1C. Modify `profiles` table

Add column: `social_links jsonb DEFAULT '{}'::jsonb`

Structure:
```json
{
  "instagram": "https://...",
  "tiktok": "https://...",
  "youtube": "https://...",
  "spotify": "https://...",
  "apple_music": "https://...",
  "soundcloud": "https://...",
  "shopify": "https://...",
  "booking": "https://..."
}
```

### 1D. Modify `artist_superfan_settings` table

Add columns:
- `message_price_credits integer DEFAULT 1` (1-5 credits per message)
- `messaging_enabled boolean DEFAULT true`
- `response_window_hours integer DEFAULT 72`

### 1E. New table: `ai_feature_flags`

Backend-only flags for future AI features (not deployed, just architecture).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| feature_key | text | unique, e.g. 'ai_voice_welcome', 'ai_thank_you_video', 'ai_loyalty_tracking' |
| enabled | boolean | default false |
| metadata | jsonb | nullable |
| created_at | timestamptz | |

Pre-populate with disabled flags.

### 1F. Modify `store_products` table

Add column: `visibility text DEFAULT 'public'`

Values: 'public', 'superfan_only', 'store_purchase_required', 'limited_time', 'permanent_exclusive'

Add column: `visibility_expires_at timestamptz` (for 'limited_time' content -- rolling 90 days)

Add column: `is_featured boolean DEFAULT false` (featured item toggle)

### 1G. Modify `store_orders` table

Add column: `download_count integer DEFAULT 0`
Add column: `max_downloads integer DEFAULT 5`

### RLS Policies

- `message_credits`: Fans can view/update their own. Service role full access.
- `message_threads`: Fans and artists can view threads they're part of. Fans can insert (with open thread check). Artists can update (reply). Service role full access.
- `ai_feature_flags`: Service role only (admin use).

---

## Phase 2: Pay-Per-Message Credit System

### New Edge Function: `purchase-message-credits`

Fan purchases message credits ($5 = 5 credits). Uses existing wallet/Stripe checkout flow pattern.

- Creates Stripe checkout session
- On success (via webhook), adds credits to `message_credits` table
- Credits never expire

### New Edge Function: `send-paid-message`

Fan sends a message to an artist.

Logic:
1. Check fan has enough credits (artist's `message_price_credits`)
2. Check no open thread exists for this fan-artist pair
3. Deduct credits atomically
4. Create `message_threads` row with status='open', expires_at = now + 72h
5. Notify artist

### New Edge Function: `process-message-expiry`

Scheduled function (or manually triggered):
1. Find threads where status='open' AND expires_at < now()
2. Refund credits to fan
3. Set status='expired', refunded=true
4. Notify fan of refund

### Modified: `stripe-webhook/index.ts`

Add handler for `metadata.type === 'message_credits'` to credit the fan's `message_credits` balance after successful payment.

### New Hook: `useMessageCredits`

- Fetch credit balance from `message_credits`
- Purchase credits function
- Send message function (calls `send-paid-message`)

### New Hook: `useMessageThreads`

- Fetch threads for a fan or artist
- Artist reply function (updates thread status to 'replied')

### Modified: `src/components/superfan/DirectMessages.tsx`

Enhance the existing DM component:
- Show credit balance
- "Buy Credits" button
- Message input deducts credits
- Show thread status (open/replied/expired)
- Display refund notifications
- Only ONE open message at a time

### New Component: `src/components/superfan/MessageCreditsPanel.tsx`

Panel showing:
- Current credit balance
- Buy credits button (5/$5 pack)
- Message cost per artist
- Thread history

---

## Phase 3: Superfan Chat Room

### Modified: `src/pages/SuperfanRoom.tsx`

Add a "Chat Room" section below Direct Messages for subscribers only:
- Text-only group chat
- Real-time via Supabase Realtime (existing `superfan_messages` table)
- No file uploads

### New Component: `src/components/superfan/ChatRoom.tsx`

- Text-only input (no file upload button)
- Scrollable message list
- Messages show username + timestamp
- Artist messages highlighted

### Artist Moderation Controls (inside Superfan Center tab)

Add to `SuperfanCenterTab.tsx`:
- Pin message toggle
- Mute user button
- Remove user button
- Lock chat toggle

### Database: Modify `superfan_messages` table

Add columns:
- `is_pinned boolean DEFAULT false`
- `is_hidden boolean DEFAULT false` (for moderation)
- `message_type text DEFAULT 'chat'` ('chat' vs 'dm')

This lets us reuse the existing table for both DMs and chat room messages by filtering on `message_type`.

---

## Phase 4: Social Links / "Find Me Everywhere"

### New Component: `src/components/profile/SocialLinksSection.tsx`

Displays artist's social links with platform icons. Each link opens in a new tab.

Supported platforms:
- Instagram, TikTok, YouTube, Website, Shopify, Spotify, Apple Music, SoundCloud, Booking

### Modified: `src/pages/ArtistProfile.tsx`

- Add "Find Me Everywhere" tab (6th tab)
- Lock tab order: Superfan | Store | Music | Activity | About | Find Me Everywhere

### Modified: `src/components/profile/ProfileEditModal.tsx`

Add social links editing fields (one text input per platform).

---

## Phase 5: Profile Tab Order (Locked)

### Modified: `src/pages/ArtistProfile.tsx`

Reorder tabs to match the specified psychology-driven order:

```text
1. Superfan (link to Superfan Room)
2. Store (if active)
3. Music (tracks)
4. Activity (feed)
5. About (bio, genres)
6. Find Me Everywhere (social links)
```

The "Superfan" tab links to `/artist/:id/superfan` (existing route).
"About" is a new lightweight tab showing bio, genres, and verified status.

---

## Phase 6: Content Visibility System

### Modified: `src/components/store/AddProductModal.tsx`

Add visibility selector:
- Public
- Superfan Only
- Store Purchase Required
- Limited Time (90-day rolling)
- Permanent Exclusive

Add "Featured Item" toggle.

### Modified: `src/components/store/ArtistStoreTab.tsx`

Filter products by visibility based on fan's superfan status.

### Modified: `supabase/functions/download-store-product/index.ts`

Add download attempt tracking:
- Increment `download_count` on each download
- Block if `download_count >= max_downloads`
- Return remaining download count in response

---

## Phase 7: AI-Ready Backend Flags

### Pre-populated flags (all disabled)

```sql
INSERT INTO ai_feature_flags (feature_key, enabled, metadata)
VALUES
  ('ai_voice_welcome', false, '{"description": "AI-generated voice welcome message for new superfans"}'),
  ('ai_thank_you_video', false, '{"description": "AI personalized superfan thank-you video"}'),
  ('ai_loyalty_tracking', false, '{"description": "AI-powered fan loyalty behavior tracking"}');
```

No frontend UI for these flags. They exist purely as architecture for future expansion.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/hooks/useMessageCredits.ts` | Message credit balance and purchase |
| `src/hooks/useMessageThreads.ts` | Paid message thread management |
| `src/components/superfan/MessageCreditsPanel.tsx` | Credit balance + buy UI |
| `src/components/superfan/ChatRoom.tsx` | Group chat room component |
| `src/components/profile/SocialLinksSection.tsx` | "Find Me Everywhere" display |
| `supabase/functions/purchase-message-credits/index.ts` | Stripe checkout for credits |
| `supabase/functions/send-paid-message/index.ts` | Send message + deduct credits |
| `supabase/functions/process-message-expiry/index.ts` | Auto-refund expired messages |

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/ArtistProfile.tsx` | Reorder tabs, add About + Find Me Everywhere tabs |
| `src/pages/SuperfanRoom.tsx` | Add ChatRoom section |
| `src/components/superfan/DirectMessages.tsx` | Integrate credit-based messaging |
| `src/components/store/SuperfanCenterTab.tsx` | Add messaging controls, chat moderation |
| `src/components/store/AddProductModal.tsx` | Add visibility selector, featured toggle |
| `src/components/store/ArtistStoreTab.tsx` | Filter by visibility + superfan status |
| `src/components/profile/ProfileEditModal.tsx` | Add social links editing |
| `supabase/functions/stripe-webhook/index.ts` | Handle message credit purchases |
| `supabase/functions/download-store-product/index.ts` | Download attempt limiting |
| `supabase/config.toml` | Register new edge functions |

---

## Implementation Order

```text
Step 1:  Database migration (new tables + column additions)
Step 2:  Social links editing + display components
Step 3:  Profile tab reorder (locked 6-tab structure)
Step 4:  Content visibility system (product modal + store filtering)
Step 5:  Message credits hooks + edge functions
Step 6:  Pay-per-message UI integration
Step 7:  Chat room component + moderation
Step 8:  Download attempt limiting
Step 9:  Stripe webhook updates for message credits
Step 10: AI feature flags (data only, no UI)
Step 11: Edge function deployment + config.toml registration
```

---

## Design Rules

- All UI uses existing glass-card / glass-card-bordered containers
- No new colors, fonts, or theme changes
- Mobile-first responsive using existing patterns
- Existing Button, Badge, Card, Tabs, Switch components only
- No aggressive upselling -- credit purchase framed as "unlock direct access"

