

# JumTunes Platform Alignment -- Gaps and Enhancements

This plan closes the remaining gaps between the current implementation and the platform direction document. It does NOT touch brand theme or visual styling.

---

## Summary of What Already Works

These features are fully implemented and need no changes:

- Stripe Connect with 85/15 split, seller agreement, store activation
- Basic product management (digital tracks, bundles, merch)
- Orders tab with status management
- Superfan membership with subscription checkout and badges
- Fan Vault with loyalty leveling and AI insights
- Activity Feed on artist profiles
- Superfan Center tab in artist dashboard

---

## Gap 1: Profile Tab Order (Locked)

**Current:** Tracks | Store | Activity (3 tabs)
**Required:** Superfan | Store | Music | Activity | About | Find Me Everywhere (6 tabs)

### Changes to `src/pages/ArtistProfile.tsx`

- Reorder tabs to the locked psychology-driven order
- "Superfan" tab links to the existing SuperfanRoom (`/artist/:id/superfan`)
- "About" tab: new lightweight section showing bio, genres, verified status, and website
- "Find Me Everywhere" tab: displays social links (see Gap 2)
- Store tab only shows if artist has an active store (existing behavior)

---

## Gap 2: Social Links ("Find Me Everywhere")

**Current:** `profiles` table has no `social_links` column. No UI for social links.
**Required:** JSONB column storing platform links. Edit UI in profile modal. Display tab on artist profile.

### Database Migration

Add column to `profiles`:
```
social_links jsonb DEFAULT '{}'::jsonb
```

### New Component: `src/components/profile/SocialLinksSection.tsx`

- Displays artist social links with platform icons (Instagram, TikTok, YouTube, Spotify, Apple Music, SoundCloud, Website, Shopify, Booking)
- Each link opens in new tab
- Shows verified badge if artist is verified

### Modified: `src/components/profile/ProfileEditModal.tsx`

- Add "Social Links" section with text inputs for each platform
- Save to `profiles.social_links` JSONB column

---

## Gap 3: Enhanced Product Management

**Current:** AddProductModal supports 3 types, basic fields only.
**Required:** 5 product types, image upload, digital file upload, visibility, variants, shipping, featured toggle.

### Modified: `src/components/store/AddProductModal.tsx`

Add:
- Product types: "Ticket / Access Pass" and "Limited Drop" options
- Image upload (using existing `store-images` bucket) -- up to 5 images
- Digital file upload field (for digital products)
- Visibility selector: Public, Superfan Only, Store Purchase Required, Limited Time, Permanent Exclusive
- "Featured Item" toggle
- Shipping price field (for physical products)
- Variants section (size/color) with add/remove UI

### Database Migration

Add columns to `store_products`:
- `visibility text DEFAULT 'public'`
- `visibility_expires_at timestamptz`
- `is_featured boolean DEFAULT false`
- `shipping_price_cents integer DEFAULT 0`

### Modified: `src/components/store/StoreProductCard.tsx`

- Add "Sold and fulfilled by [Artist Name]" text under each product card
- Show "Featured" badge for featured items

### Modified: `src/components/store/ArtistStoreTab.tsx`

- Filter products by visibility based on fan's superfan status
- Show "Sold and fulfilled by [Artist Name]" on store header

---

## Gap 4: Enhanced Order Management

**Current:** View orders, mark as fulfilled/shipped.
**Required:** CSV download, tracking number, refund capability.

### Modified: `src/components/store/OrdersTab.tsx`

Add:
- "Download CSV" button that exports buyer list
- Tracking number input field (add `tracking_number text` column to `store_orders`)
- "Issue Refund" button that calls the Stripe refund API

### Database Migration

Add column to `store_orders`:
- `tracking_number text`
- `download_count integer DEFAULT 0`
- `max_downloads integer DEFAULT 5`

### New Edge Function: `supabase/functions/refund-store-order/index.ts`

- Accepts order ID
- Verifies the artist owns the order
- Calls Stripe Refunds API using the payment intent
- Updates order status to "refunded"

---

## Gap 5: Pay-Per-Message Credit System

**Current:** `message_credits` and `message_threads` tables exist in DB. No edge functions or UI.
**Required:** Full credit purchase, send message, auto-refund flow.

### New Edge Functions

1. `supabase/functions/purchase-message-credits/index.ts` -- Creates Stripe checkout for $5 = 5 credits
2. `supabase/functions/send-paid-message/index.ts` -- Deducts credits, creates thread, enforces one-open-thread rule
3. `supabase/functions/process-message-expiry/index.ts` -- Auto-refunds expired threads (72h)

### New Hooks

1. `src/hooks/useMessageCredits.ts` -- Fetch balance, purchase credits
2. `src/hooks/useMessageThreads.ts` -- Fetch threads, artist reply

### New Component: `src/components/superfan/MessageCreditsPanel.tsx`

- Shows credit balance
- "Buy Credits" button ($5 for 5)
- Message cost display per artist

### Modified: `src/components/superfan/DirectMessages.tsx`

- Integrate credit-based messaging alongside subscription-based
- Show thread status (open/replied/expired)
- Enforce one-open-thread rule
- Display refund notifications

### Modified: `src/components/store/SuperfanCenterTab.tsx`

- Add messaging controls: cost per message (1-5), enable/disable, response window

### Database Migration

Add columns to `artist_superfan_settings`:
- `message_price_credits integer DEFAULT 1`
- `messaging_enabled boolean DEFAULT true`
- `response_window_hours integer DEFAULT 72`

---

## Gap 6: Superfan Chat Room

**Current:** No group chat component.
**Required:** Text-only group chat for subscribers with artist moderation.

### Database Migration

Add columns to `superfan_messages`:
- `is_pinned boolean DEFAULT false`
- `is_hidden boolean DEFAULT false`
- `message_type text DEFAULT 'chat'`

### New Component: `src/components/superfan/ChatRoom.tsx`

- Text-only input (no file uploads)
- Real-time via Supabase Realtime
- Artist messages highlighted
- Pinned messages shown at top

### Modified: `src/pages/SuperfanRoom.tsx`

- Add ChatRoom section below Direct Messages (for subscribers only)

### Modified: `src/components/store/SuperfanCenterTab.tsx`

- Add moderation controls: pin message, mute user, remove user, lock chat

---

## Gap 7: Merchant Responsibility Agreement

**Current:** Seller agreement exists in StoreSetupTab with checkbox + timestamp.
**Required:** Updated wording per the platform direction.

### Modified: `src/components/store/StoreSetupTab.tsx`

- Update agreement text to match the exact wording from the direction document
- No structural changes needed -- the mechanism already works

---

## Implementation Order

```text
Step 1:  Database migration (social_links, store_products columns, store_orders columns, superfan_messages columns, artist_superfan_settings columns)
Step 2:  Social links component + profile edit integration
Step 3:  Profile tab reorder (6-tab locked structure with About + Find Me Everywhere)
Step 4:  Enhanced AddProductModal (types, images, visibility, variants, shipping)
Step 5:  Enhanced OrdersTab (CSV, tracking, refund)
Step 6:  refund-store-order edge function
Step 7:  Message credit edge functions (purchase, send, expiry)
Step 8:  Message credits hooks + UI
Step 9:  ChatRoom component + moderation
Step 10: Merchant agreement text update
Step 11: Edge function deployment + config.toml
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/profile/SocialLinksSection.tsx` | "Find Me Everywhere" display |
| `src/components/superfan/ChatRoom.tsx` | Text-only group chat |
| `src/components/superfan/MessageCreditsPanel.tsx` | Credit balance + buy UI |
| `src/hooks/useMessageCredits.ts` | Message credit balance and purchase |
| `src/hooks/useMessageThreads.ts` | Paid message thread management |
| `supabase/functions/purchase-message-credits/index.ts` | Stripe checkout for credits |
| `supabase/functions/send-paid-message/index.ts` | Send message + deduct credits |
| `supabase/functions/process-message-expiry/index.ts` | Auto-refund expired threads |
| `supabase/functions/refund-store-order/index.ts` | Store order refund via Stripe |

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/ArtistProfile.tsx` | 6-tab locked order, About tab, Find Me Everywhere tab |
| `src/components/profile/ProfileEditModal.tsx` | Social links editing fields |
| `src/components/store/AddProductModal.tsx` | Types, visibility, images, variants, shipping |
| `src/components/store/StoreProductCard.tsx` | "Sold and fulfilled by" text, featured badge |
| `src/components/store/ArtistStoreTab.tsx` | Visibility filtering, merchant attribution |
| `src/components/store/OrdersTab.tsx` | CSV download, tracking number, refund button |
| `src/components/store/StoreSetupTab.tsx` | Updated merchant agreement wording |
| `src/components/store/SuperfanCenterTab.tsx` | Messaging controls, chat moderation |
| `src/components/superfan/DirectMessages.tsx` | Credit-based messaging integration |
| `src/pages/SuperfanRoom.tsx` | ChatRoom section |
| `supabase/config.toml` | Register new edge functions |

---

## Design Rules

- All UI uses existing glass-card / glass-card-bordered containers
- No new colors, fonts, or theme changes
- Mobile-first responsive using existing patterns
- Existing Button, Badge, Card, Tabs, Switch components only
