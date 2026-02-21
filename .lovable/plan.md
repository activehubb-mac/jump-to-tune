

# JumTunes Superfan Commerce Platform -- Gap Implementation

## Current State

Approximately 85% of the spec is already live. The following systems exist and require NO changes:

- Fan/Artist/Admin roles with separate dashboards
- Artist Store with Stripe Connect (15% platform fee)
- Inventory-tracked digital products and merch
- Fan loyalty system with 5 badge tiers (Listener through Founding Superfan)
- Pay-per-message credit system (fan-to-artist only)
- Follow system with optional public count
- Trending algorithm (purchases + likes weighted)
- Activity feed on artist profiles
- Artist analytics (revenue, followers, repeat buyers, sellout tracking)
- Admin dashboard (featured content, user management, reports)
- Personalized homepage (followed artists first, fallback to trending + featured)
- Notification center with push support

The music player is untouched throughout -- all changes integrate around it.

## What Needs to Be Built

### Phase 1: Database Schema Additions

**New table: `drop_waitlists`**
- id, product_id (FK to store_products), user_id, created_at
- Unique constraint on (product_id, user_id) to prevent duplicate counting
- RLS: users can join/leave their own waitlist entries; artists can view waitlists for their products; public count available

**New table: `announcements`**
- id, artist_id, text, image_url, cta_text, cta_url, is_highlight (temporary banner), audience_filter (jsonb: all_followers / paying_supporters / drop_owners / badge_tier / waitlist_members), created_at
- RLS: artists can CRUD their own; fans can view announcements from followed artists

**New table: `announcement_reactions`**
- id, announcement_id, user_id, emoji, created_at
- Unique constraint on (announcement_id, user_id) -- one reaction per fan
- RLS: authenticated users can add/remove their own reactions; public read

**Columns added to `store_products`:**
- `max_per_account` (integer, nullable) -- limits purchases per user
- `scheduled_release_at` (timestamptz, nullable) -- future release scheduling
- `parent_product_id` (uuid, nullable, self-FK) -- links V2 drops to V1

### Phase 2: Waitlist System

**When a product sells out (inventory_sold >= inventory_limit):**
- Purchase button disables automatically (already works via inventory check)
- "Join Waitlist" button appears (new UI)
- Public waitlist count shown on product card

**Backend logic:**
- Hook: `useWaitlist` -- join, leave, check membership, get count
- When artist creates a new version (V2), all waitlist members for the original get a notification
- No reserved inventory, no early access -- simultaneous notification only

### Phase 3: Announcement System

**Artist Dashboard -- new "Announcements" tab in Store:**
- Compose: text + optional image upload + optional CTA button
- Audience filter selector: All Followers, Paying Supporters, Specific Drop Owners, Badge Tier, Waitlist Members
- Highlight toggle (shows as temporary banner on artist profile)
- Spam prevention: rate limit of 3 announcements per 24 hours (client-enforced)

**Fan-facing:**
- Announcements appear in artist profile activity feed
- Emoji-only reactions (heart, fire, rocket, star, clap -- 5 options)
- No comments allowed
- Highlighted announcements show as banner at top of artist profile

### Phase 4: Drop Versioning

**When a drop sells out, artist can "Create Version 2":**
- New product entry created with `parent_product_id` pointing to original
- Separate supply, separate analytics
- Original version remains permanently visible (already true -- products are never deleted)
- UI shows version lineage: "V1 (Sold Out) -> V2 (Available)"

### Phase 5: Demand Ratio in Trending

**Update `useTrendingTracks` to include store products:**
- Calculate demand ratio: `waitlist_count / inventory_limit`
- Factor demand ratio into engagement score alongside purchases and likes
- Products with high demand ratio surface higher in trending
- Sold out products with active waitlists remain in trending

### Phase 6: Per-Account Limits and Scheduled Releases

**Max per account:**
- During checkout, validate purchase count for this user + product
- Block if `max_per_account` reached
- Show remaining allowance on product card

**Scheduled releases:**
- Products with future `scheduled_release_at` show countdown timer
- Purchase button locked until release time
- "Notify Me" option adds to waitlist automatically

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useWaitlist.ts` | Join/leave waitlist, check status, get counts |
| `src/hooks/useAnnouncements.ts` | CRUD announcements with audience filtering |
| `src/hooks/useAnnouncementReactions.ts` | Add/remove emoji reactions |
| `src/components/store/WaitlistButton.tsx` | Join Waitlist UI component |
| `src/components/store/AnnouncementsTab.tsx` | Artist announcement composer |
| `src/components/artist/AnnouncementCard.tsx` | Fan-facing announcement with reactions |
| `src/components/store/CreateVersionModal.tsx` | V2 drop creation from sold-out product |
| `src/components/store/ScheduledReleaseBadge.tsx` | Countdown timer for scheduled drops |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/store/ProductsTab.tsx` | Add waitlist count, version indicator, max-per-account display, "Create V2" button on sold-out items |
| `src/components/store/StoreProductCard.tsx` | Show waitlist button when sold out, scheduled release countdown |
| `src/pages/ArtistStore.tsx` | Add "Announcements" tab |
| `src/pages/ArtistProfile.tsx` | Show highlighted announcements banner, announcement feed |
| `src/hooks/useTrendingTracks.ts` | Add demand ratio calculation |
| `src/hooks/useStoreProducts.ts` | Include new columns in type and queries |
| `supabase/functions/create-store-checkout/index.ts` | Add max-per-account validation |
| `supabase/functions/stripe-webhook/index.ts` | Notify waitlist members on restock/V2 |
| `src/components/store/AddProductModal.tsx` | Add max-per-account and scheduled release fields |

## Implementation Order

1. Database migrations (tables + columns + RLS)
2. Waitlist system (hook + UI + backend validation)
3. Announcement system (hook + composer + feed cards + reactions)
4. Drop versioning (modal + product linking + UI indicators)
5. Demand ratio in trending
6. Per-account limits + scheduled releases
7. End-to-end testing

## What This Does NOT Change

- Music player logic (completely untouched)
- Existing purchase flow for non-limited products
- Existing loyalty/badge tier system (Listener through Founding Superfan)
- Follow mechanics
- Pay-per-message system
- Stripe Connect onboarding
- Admin dashboard

