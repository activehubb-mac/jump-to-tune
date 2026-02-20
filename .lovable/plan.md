

# Artist Store System - Implementation Plan

This builds on the existing Stripe Connect infrastructure and Superfan Room to add a full storefront for artists. No visual theme changes.

---

## What Already Exists (No Rebuild Needed)

- Stripe Connect Express onboarding (`create-connect-account` edge function, `useStripeConnect` hook)
- Artist Payouts page (`/artist/payouts`) with status badges (Active/Pending/Not Connected)
- 85/15 revenue split in `spend-credits` and `create-superfan-checkout`
- Superfan memberships and subscriptions (tables + checkout + webhook handling)
- Seller Responsibility clause in Terms of Service

---

## Phase 1: Database Tables (Migration)

### `artist_stores`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | unique, references profiles |
| store_status | text | 'inactive' / 'active', default 'inactive' |
| platform_fee_percentage | integer | default 15 |
| seller_agreement_accepted | boolean | default false |
| seller_agreement_accepted_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | |

RLS: Artists manage own store. Public can view active stores.

### `store_products`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | FK |
| type | text | 'digital_track', 'digital_bundle', 'merch', 'superfan' |
| title | text | |
| description | text | nullable |
| price_cents | integer | |
| image_url | text | nullable |
| audio_url | text | nullable (for digital tracks) |
| inventory_limit | integer | nullable (unlimited if null) |
| inventory_sold | integer | default 0 |
| is_exclusive | boolean | default false |
| is_early_release | boolean | default false |
| variants | jsonb | nullable, for merch sizes/colors |
| is_active | boolean | default true |
| created_at / updated_at | timestamptz | |

RLS: Artists manage own. Public views active products from active stores.

### `store_orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| product_id | uuid | FK |
| buyer_id | uuid | |
| artist_id | uuid | |
| stripe_payment_intent_id | text | nullable |
| amount_cents | integer | |
| platform_fee_cents | integer | |
| status | text | 'pending', 'completed', 'fulfilled', 'shipped', 'refunded' |
| shipping_address | jsonb | nullable, for merch |
| buyer_name | text | nullable |
| buyer_email | text | nullable |
| edition_number | integer | nullable, for limited editions |
| created_at | timestamptz | |

RLS: Buyers see own. Artists see their orders. Admins see all.

### Storage bucket
- Create `store-images` bucket (public) for product images

---

## Phase 2: "Store & Earnings" Tab on Artist Dashboard

### New page: `/artist/store`

Add a new route and page `ArtistStore.tsx` with tabs:

**Tab 1: Store Setup**
- Stripe Connect status display (reuse `useStripeConnect` hook)
- "Activate My Store" toggle (disabled until Stripe is active)
- Seller agreement checkbox with confirmation text
- Store status indicator

**Tab 2: Products**
- List of artist's store products with filters by type
- "Add Product" button opens a modal/form
- Product creation form with fields per type:
  - Digital Track: audio upload, cover, title, description, price, optional limited qty, early release badge
  - Digital Bundle: multiple audio files, cover, title, description, price
  - Merch: images, title, description, price, variants (size/color JSON), inventory
- Edit/deactivate products
- Inventory tracking display

**Tab 3: Orders**
- List of orders with status badges
- For merch orders: show shipping address, buyer name
- Artist can mark orders as "Fulfilled" or "Shipped"
- Filter by status (Pending / Fulfilled / Shipped)

**Tab 4: Analytics**
- Total revenue, platform fees paid, total orders
- Top product by sales
- Superfan count (from existing superfan_subscribers)
- Recent orders list
- Simple stats cards using existing glass-card styling

### Dashboard Quick Action
Add "My Store" link to ArtistDashboard quick actions panel.

---

## Phase 3: Store Checkout Edge Function

### New: `create-store-checkout/index.ts`
- Accepts product_id, quantity, and optional shipping_address (for merch)
- Validates product exists and is active
- Checks inventory if limited
- Creates Stripe Checkout session with:
  - `application_fee_amount` (15%)
  - `transfer_data.destination` to artist's Connect account
  - For merch: collects shipping address via Stripe Checkout
  - Metadata: `type: "store"`, `product_id`, `artist_id`, `buyer_id`
- Returns checkout URL

### Webhook updates in `stripe-webhook/index.ts`
- Handle `checkout.session.completed` with `metadata.type === "store"`:
  - Insert into `store_orders` with status 'completed' (digital) or 'pending' (merch)
  - Increment `inventory_sold` on `store_products`
  - Assign edition number for limited products
  - Create earnings record in `artist_earnings`

---

## Phase 4: Secure Digital Delivery

### New: `download-store-product/index.ts`
- Verifies buyer has a completed order for the product
- Generates signed URL from private storage bucket
- Returns temporary download link
- Mirrors existing `download-track` pattern

---

## Phase 5: Public Artist Store Tab

### Modified: `ArtistProfile.tsx`
- Add "Store" tab/section alongside existing Tracks section
- Only visible if artist has an active store (`artist_stores.store_status = 'active'`)

### New component: `ArtistStoreTab.tsx`
- Sections: Featured Product, Digital Drops, Limited Editions, Merch, Superfan Banner
- Each product card shows: image, title, price, type badge, "Owned" badge if purchased
- Buy button triggers `create-store-checkout`
- "Support Directly" messaging on store header
- Limited edition items show "X of Y remaining"
- Merch items show variant selector (size/color)

---

## Phase 6: Hooks

| Hook | Purpose |
|------|---------|
| `useArtistStore(artistId)` | Fetch/manage store config |
| `useStoreProducts(artistId, filters)` | Fetch products with type filters |
| `useStoreOrders(artistId)` | Fetch orders for artist dashboard |
| `useStoreCheckout()` | Handle checkout flow |

---

## Files Created

1. `src/pages/ArtistStore.tsx` -- Store management page with tabs
2. `src/components/store/StoreSetupTab.tsx` -- Stripe connect + activation
3. `src/components/store/ProductsTab.tsx` -- Product list + add/edit
4. `src/components/store/AddProductModal.tsx` -- Product creation form
5. `src/components/store/OrdersTab.tsx` -- Order management
6. `src/components/store/StoreAnalyticsTab.tsx` -- Revenue stats
7. `src/components/store/ArtistStoreTab.tsx` -- Public-facing store on profile
8. `src/components/store/StoreProductCard.tsx` -- Product display card
9. `src/hooks/useArtistStore.ts`
10. `src/hooks/useStoreProducts.ts`
11. `src/hooks/useStoreOrders.ts`
12. `src/hooks/useStoreCheckout.ts`
13. `supabase/functions/create-store-checkout/index.ts`
14. `supabase/functions/download-store-product/index.ts`

## Files Modified

1. `src/App.tsx` -- Add `/artist/store` route
2. `src/pages/ArtistDashboard.tsx` -- Add "My Store" quick action
3. `src/pages/ArtistProfile.tsx` -- Add Store tab for public profiles
4. `src/components/layout/Navbar.tsx` -- Add Store link in artist menu
5. `supabase/functions/stripe-webhook/index.ts` -- Handle store purchases
6. `supabase/config.toml` -- Register new edge functions

---

## Implementation Order

```text
Step 1: Database migration (3 tables + storage bucket + RLS)
Step 2: Hooks (useArtistStore, useStoreProducts, useStoreOrders, useStoreCheckout)
Step 3: Artist Store management page with all 4 tabs
Step 4: create-store-checkout edge function
Step 5: Webhook updates for store purchases
Step 6: download-store-product edge function
Step 7: Public store tab on ArtistProfile
Step 8: Route + navigation integration
```

---

## Design Rules

- All UI uses existing `glass-card` / `glass-card-bordered` containers
- Existing Button, Badge, Card, Tabs components only
- No new colors, fonts, or theme tokens
- Mobile-first responsive using existing grid patterns
- "Support Directly" tone -- no anti-streaming language

## Future-Ready Structure

The `store_products.type` field and `variants` JSONB column are designed to later support:
- Print-on-demand API integration (add `fulfillment_provider` column)
- Ticket sales (type: 'ticket', add event date to variants)
- Live event access (type: 'event')
- NFT-style limited releases (already supported via `inventory_limit` + `edition_number`)
- AI fan features (query `store_orders` for fan segmentation)

