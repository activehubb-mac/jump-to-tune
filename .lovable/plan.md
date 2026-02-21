

# Superfan Commerce Platform -- Backend Implementation

## Current State Assessment

The existing database and codebase already covers roughly 80% of the spec:

**Already Built (no changes needed):**
- User roles (fan/artist/admin) in `user_roles` table with `has_role()` security definer
- Profiles with Stripe Connect fields (`stripe_account_id`, `stripe_payouts_enabled`)
- Artist superfan settings (`messaging_enabled`, `show_follower_count` equivalent via `show_top_supporters`)
- Follow system with unique constraint and notification trigger
- Store products with inventory tracking (`store_products`)
- Store orders with platform fee, edition numbers, shipping
- Stripe Connect checkout with 15% application fee (`create-store-checkout`)
- Stripe webhook handling store purchases (inventory increment, earnings, notifications)
- Fan loyalty / badge system (`fan_loyalty` with levels)
- Pay-per-message system (`message_credits`, `message_threads`)
- Artist analytics (earnings, followers, repeat buyers)
- Trending algorithm (`useTrendingTracks`)
- Activity feed on artist profiles
- Notification center with push support

**What Needs to Be Built (the gaps):**

### Phase 1: Database Schema Changes

**Add columns to `store_products`:**
- `max_per_account` (integer, nullable) -- per-fan purchase cap
- `scheduled_release_at` (timestamptz, nullable) -- future drop scheduling
- `parent_product_id` (uuid, nullable, self-referencing FK) -- V2 drop versioning
- `status` (text, default 'active') -- draft/active/sold_out/archived lifecycle

**New table: `drop_waitlists`**
- `id` uuid PK
- `product_id` uuid FK to store_products
- `user_id` uuid (authenticated user)
- `created_at` timestamptz
- Unique constraint on (product_id, user_id) to prevent duplicates
- RLS: users manage their own entries; artists can view waitlists for their products; anyone can count

**New table: `announcements`**
- `id` uuid PK
- `artist_id` uuid
- `title` text
- `body` text
- `image_url` text (nullable)
- `cta_label` text (nullable)
- `cta_url` text (nullable)
- `is_highlighted` boolean (default false)
- `audience_filter` jsonb (nullable) -- targeting: all_followers, paying_supporters, drop_owners, badge_tier, waitlist_members
- `created_at` timestamptz
- RLS: artists CRUD their own; fans read announcements from followed artists

**New table: `announcement_reactions`**
- `id` uuid PK
- `announcement_id` uuid FK to announcements
- `user_id` uuid
- `emoji` text (constrained to allowed set)
- `created_at` timestamptz
- Unique constraint on (announcement_id, user_id) -- one reaction per fan per announcement
- RLS: authenticated users add/remove their own; public read

### Phase 2: Waitlist System

**New file: `src/hooks/useWaitlist.ts`**
- `joinWaitlist(productId)` -- insert into drop_waitlists
- `leaveWaitlist(productId)` -- delete from drop_waitlists
- `isOnWaitlist(productId)` -- check membership
- `waitlistCount(productId)` -- public count query

**New file: `src/components/store/WaitlistButton.tsx`**
- Replaces "Buy" button when product is sold out
- Shows "Join Waitlist" / "On Waitlist" toggle
- Displays public waitlist count

**Modify: `src/components/store/StoreProductCard.tsx`**
- When `remaining === 0`: show WaitlistButton instead of disabled "Sold Out" button
- Show waitlist count badge

### Phase 3: Announcement System

**New file: `src/hooks/useAnnouncements.ts`**
- CRUD operations for artist announcements
- Audience filter support
- Rate limiting (max 3 per 24h, client-enforced)

**New file: `src/hooks/useAnnouncementReactions.ts`**
- Add/remove emoji reactions
- Fetch reaction counts per announcement

**New file: `src/components/store/AnnouncementsTab.tsx`**
- Artist-facing composer: title, body, image upload, CTA, audience filter, highlight toggle
- List of existing announcements with reaction counts

**New file: `src/components/artist/AnnouncementCard.tsx`**
- Fan-facing announcement display
- Emoji reaction buttons (fire, gem, rocket, thumbsup)
- CTA button rendering

**Modify: `src/pages/ArtistStore.tsx`**
- Add "Announcements" tab with Megaphone icon

**Modify: `src/pages/ArtistProfile.tsx`**
- Show highlighted announcements as banner
- Show announcement feed in activity section

### Phase 4: Drop Versioning

**New file: `src/components/store/CreateVersionModal.tsx`**
- Triggered from sold-out products
- Pre-fills from parent product
- Sets `parent_product_id` to original
- Separate supply and analytics

**Modify: `src/components/store/ProductsTab.tsx`**
- "Create V2" button on sold-out items
- Version lineage indicator (V1 Sold Out -> V2 Available)

**Modify: `src/hooks/useStoreProducts.ts`**
- Add new columns to StoreProduct interface
- Include `parent_product_id`, `max_per_account`, `scheduled_release_at`, `status`

### Phase 5: Demand-Based Trending

**Modify: `src/hooks/useTrendingTracks.ts`**
- Add demand ratio calculation: `waitlist_count / inventory_limit`
- Factor into engagement score
- Sold-out products with active waitlists remain in trending

### Phase 6: Per-Account Limits and Scheduled Releases

**Modify: `supabase/functions/create-store-checkout/index.ts`**
- Validate `max_per_account`: count existing orders for this buyer + product, block if limit reached
- Validate `scheduled_release_at`: block purchase before release time

**New file: `src/components/store/ScheduledReleaseBadge.tsx`**
- Countdown timer for scheduled drops
- Purchase button locked until release time

**Modify: `src/components/store/StoreProductCard.tsx`**
- Show countdown for scheduled releases
- Show remaining purchase allowance when `max_per_account` is set

**Modify: `src/components/store/AddProductModal.tsx`**
- Add `max_per_account` field
- Add `scheduled_release_at` datetime picker

### Phase 7: Webhook Enhancement

**Modify: `supabase/functions/stripe-webhook/index.ts`**
- After store purchase: award loyalty points via existing `award-loyalty-points` function
- After store purchase: check if product just sold out, auto-update status to 'sold_out'
- When V2 created: notify all waitlist members for parent product

## What This Does NOT Change

- Music player logic (completely untouched)
- Upload flow (completely untouched)
- Existing purchase flow for tracks
- Existing loyalty tier system
- Follow mechanics
- Pay-per-message system
- Stripe Connect onboarding
- Admin dashboard

## Implementation Order

1. Database migration (new tables + columns + RLS policies)
2. Waitlist hook + UI
3. Announcement hook + composer + feed + reactions
4. Drop versioning modal + lineage UI
5. Demand ratio in trending
6. Per-account limits + scheduled releases in checkout + UI
7. Webhook enhancements (auto sold-out, waitlist notifications)

## Security Enforced

- Unique constraints prevent duplicate follows, waitlist entries, and reactions
- Stripe account required before checkout (already enforced)
- 15% platform fee hardcoded in edge function (not configurable by artist)
- Artist controls all store settings (pricing, messaging, visibility)
- Platform never stores card data (Stripe handles everything)
- RLS policies on all new tables using `auth.uid()` checks
- Atomic inventory decrement via webhook (already implemented)

