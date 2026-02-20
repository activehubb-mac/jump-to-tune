

# Superfan Store & Marketplace Infrastructure - Phased Plan

This is a large feature set. Below is a phased approach so each piece ships independently and builds on the last.

---

## What's Already Done (No Changes Needed)

- Stripe Connect Express onboarding and account management
- 85/15 revenue split with automatic Stripe transfers
- Artist payouts dashboard with earnings tracking
- Payment flow (checkout, webhooks, credit wallet purchases)

---

## Phase 1: Seller Agreement (Terms of Service Update)

**File**: `src/pages/Terms.tsx`

Add a new "Seller Responsibility" section to the existing Terms of Service page with the legal language provided:

- Artists act as independent merchants
- Responsible for fulfillment, refunds, chargebacks, taxes, IP rights
- JumTunes is not merchant of record
- Payments processed via Stripe Connect, funds transferred directly minus platform fees

---

## Phase 2: Database Schema (New Tables)

Create the following tables via migration:

### `artist_stores` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | FK to profiles, unique |
| store_status | text | 'active' / 'inactive', default 'inactive' |
| platform_fee_percentage | integer | default 15 |
| created_at / updated_at | timestamptz | |

RLS: Artists can manage their own store. Public can view active stores.

### `store_products` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | FK to profiles |
| type | text | 'track', 'merch', 'ticket', 'bundle' |
| title | text | |
| description | text | nullable |
| price | numeric | in dollars |
| inventory_limit | integer | nullable (unlimited if null) |
| is_exclusive | boolean | default false |
| image_url | text | nullable |
| is_active | boolean | default true |
| created_at / updated_at | timestamptz | |

RLS: Artists manage own products. Public views active products.

### `store_orders` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| product_id | uuid | FK to store_products |
| buyer_id | uuid | |
| artist_id | uuid | |
| stripe_payment_intent_id | text | nullable |
| amount_cents | integer | |
| platform_fee_cents | integer | |
| status | text | 'pending', 'completed', 'refunded' |
| created_at | timestamptz | |

RLS: Buyers see own orders. Artists see orders for their products. Admins see all.

### `superfan_memberships` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | unique |
| monthly_price_cents | integer | |
| perks_description | text | nullable |
| is_active | boolean | default false |
| created_at / updated_at | timestamptz | |

RLS: Artists manage own. Public views active memberships.

### `superfan_subscribers` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| membership_id | uuid | FK |
| fan_id | uuid | |
| status | text | 'active', 'canceled' |
| stripe_subscription_id | text | nullable |
| subscribed_at | timestamptz | |

RLS: Fans see own subscriptions. Artists see subscribers to their membership.

---

## Phase 3: Superfan Center Tab (Artist Dashboard)

Add a new page `/artist/superfan-center` accessible from the Artist Dashboard, with tabs:

### Tab A: Storefront
- List of artist's store products (tracks, merch, tickets, bundles)
- Add/edit/deactivate products
- Inventory tracking
- Links to existing track upload for track-type products

### Tab B: Superfan Membership
- Enable/disable membership
- Set monthly price
- Edit perks description
- View subscriber count and list

### Tab C: Fan Insights (Phase 1 of "AI Tools")
- Top supporters leaderboard (by total spend from purchases table)
- Recent supporters
- Fan engagement stats (likes, purchases, follows)
- These use existing data -- no AI needed initially

### Tab D: Social Links
- Artist can add/edit social media links (Instagram, TikTok, YouTube)
- Displayed on artist profile page
- Requires adding a `social_links` JSONB column to profiles table

---

## Phase 4: Store Checkout Flow

### New edge function: `create-store-checkout`
- Creates Stripe Checkout for store_products (merch, tickets, bundles)
- Uses existing Stripe Connect with `application_fee_amount` and `transfer_data.destination`
- Records order in `store_orders` table
- Sends notifications to buyer and seller

### Webhook updates
- Handle store product purchases in existing `stripe-webhook`
- Update order status on payment completion

---

## Phase 5: Fan-Facing Storefront

### Artist Profile Enhancement
- Add "Store" tab to artist profile page (`/artist/:id`)
- Display active store products with purchase buttons
- Show superfan membership signup option
- Display social links

### Superfan Badge
- Fans who subscribe get a VIP badge shown on their profile
- Badge visible in comments/interactions

---

## Phase 6: Future Enhancements (Not in Initial Build)

These are noted for future iterations:
- Direct fan chat / broadcast messaging
- Paid message unlock
- Fan streak tracking
- AI-powered fan segments
- Merch shop embedding

---

## Implementation Order

```text
Phase 1 --> Phase 2 --> Phase 3 --> Phase 4 --> Phase 5
(Terms)    (Database)   (Dashboard)  (Checkout)  (Fan UI)
```

Each phase can be approved and built independently. Phase 1 and 2 have no UI dependencies and can ship together. Phase 3 builds the artist-facing management UI. Phase 4 adds the payment flow. Phase 5 exposes everything to fans.

---

## Technical Notes

- No new secrets needed -- uses existing STRIPE_SECRET_KEY
- Store products for type 'track' will reference existing tracks table rather than duplicating
- The `platform_fee_percentage` field on `artist_stores` allows future per-artist fee customization but defaults to 15%
- Social links stored as JSONB on profiles avoids creating a separate table for simple key-value pairs
- Superfan memberships will use Stripe recurring billing through the existing Connect infrastructure
