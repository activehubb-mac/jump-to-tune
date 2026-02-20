
# Superfan Room - Implementation Plan

Build the Superfan Room as a native extension of the artist profile page, using existing JumTunes glass-card styling, buttons, and layout patterns. No visual theme changes.

---

## Phase 1: Database Tables (Migration)

Create 3 new tables to support the Superfan Room:

### `superfan_memberships`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | unique, references profiles |
| monthly_price_cents | integer | default 499 (i.e. $4.99) |
| description | text | nullable, artist-written pitch |
| perks | jsonb | default list of perks |
| is_active | boolean | default false |
| created_at / updated_at | timestamptz | |

### `superfan_subscribers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| membership_id | uuid | FK to superfan_memberships |
| artist_id | uuid | for easy querying |
| fan_id | uuid | the subscriber |
| status | text | 'active', 'canceled', 'expired' |
| tier_level | text | 'bronze', 'gold', 'elite' |
| lifetime_spent_cents | integer | default 0 |
| stripe_subscription_id | text | nullable |
| subscribed_at | timestamptz | |
| created_at | timestamptz | |

### `superfan_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | |
| fan_id | uuid | |
| sender_id | uuid | either artist or fan |
| message | text | |
| created_at | timestamptz | |

**RLS Policies:**
- Memberships: Artists manage their own. Public can view active ones.
- Subscribers: Fans see their own. Artists see their subscribers. Service role manages all.
- Messages: Only the artist and the specific fan in the conversation can read/write.

---

## Phase 2: New Route and Page

### Add route `/artist/:id/superfan`

New file: `src/pages/SuperfanRoom.tsx`

This page loads the artist profile data and the fan's subscription status, then renders 5 sections using existing glass-card styling.

---

## Phase 3: Superfan Room UI Sections

All sections use `glass-card` / `glass-card-bordered` containers, existing Button variants, and the current color tokens (primary gold, accent copper, muted grays).

### A. "Enter Superfan Room" Button
- Added to `ArtistProfile.tsx` in the action buttons row (next to Follow and Share)
- Links to `/artist/:id/superfan`
- Uses existing `Button` with `variant="outline"` and a Star icon

### B. Status Panel (Top of Superfan Room)

**Not subscribed:**
- Glass card with short description: "Unlock exclusive content and early access."
- Subscribe button (triggers Stripe checkout)
- Bullet list: Early drops, Exclusive versions, Direct support access

**Subscribed:**
- Glass card showing: Superfan badge, join date, lifetime support amount, tier indicator (Bronze / Gold / Elite based on lifetime_spent_cents thresholds), "Thank you for supporting" message

### C. Exclusive Drops Section
- Queries tracks marked as `is_exclusive` (uses existing track card layout)
- Tags: "Superfan Exclusive", "Early Access", "Limited Edition (X remaining)", "Owned"
- If not subscribed: CSS blur + overlay "Subscribe to unlock"

### D. VIP Perks Section
- Content cards for perks (static for now, expandable later)
- Behind-the-scenes, bonus content, announcements, countdown
- If locked: slight blur + lock icon + CTA

### E. Top Supporters Strip
- Small section showing top 3 supporters this month (by purchases of that artist's tracks)
- Current user's rank if applicable
- Uses existing compact layout, no gamification

### F. Direct Messages Section
- Non-subscribers see: "Subscribe to message this artist."
- Subscribers see a minimal text chat interface
- Clean input + message list using glass-card styling
- Messages stored in `superfan_messages` table

---

## Phase 4: Subscription Flow

### New edge function: `create-superfan-checkout`
- Creates a Stripe Checkout session in subscription mode
- Uses Stripe Connect: `application_fee_amount` (15%) + `transfer_data.destination` to artist's connected account
- On success, creates/updates `superfan_subscribers` row
- Returns checkout URL

### Webhook handling
- Add superfan subscription handling to existing `stripe-webhook` edge function
- On `checkout.session.completed` with superfan metadata: insert subscriber record
- On `customer.subscription.deleted`: update status to 'expired'

---

## Phase 5: Hooks

### `useSuperfanMembership(artistId)`
- Fetches the artist's membership config (price, description, active status)

### `useSuperfanStatus(artistId, fanId)`
- Checks if the current user is an active subscriber to this artist
- Returns subscription details, tier, lifetime spent

### `useSuperfanMessages(artistId, fanId)`
- Fetches messages between artist and fan
- Provides send function

### `useTopSupporters(artistId)`
- Queries purchases table for top spenders on this artist's tracks in current month

---

## Files Created/Modified

### New files:
1. `src/pages/SuperfanRoom.tsx` -- Main Superfan Room page
2. `src/components/superfan/StatusPanel.tsx` -- Subscribe/status card
3. `src/components/superfan/ExclusiveDrops.tsx` -- Exclusive tracks with blur/lock
4. `src/components/superfan/VIPPerks.tsx` -- Perks cards with lock state
5. `src/components/superfan/TopSupporters.tsx` -- Supporter leaderboard strip
6. `src/components/superfan/DirectMessages.tsx` -- Chat section
7. `src/hooks/useSuperfanMembership.ts` -- Membership data hook
8. `src/hooks/useSuperfanStatus.ts` -- Subscriber status hook
9. `src/hooks/useSuperfanMessages.ts` -- Messages hook
10. `src/hooks/useTopSupporters.ts` -- Top supporters hook
11. `supabase/functions/create-superfan-checkout/index.ts` -- Stripe checkout for superfan subscriptions

### Modified files:
1. `src/pages/ArtistProfile.tsx` -- Add "Enter Superfan Room" button
2. `src/App.tsx` -- Add `/artist/:id/superfan` route
3. `supabase/functions/stripe-webhook/index.ts` -- Handle superfan subscription events
4. `supabase/config.toml` -- Add new edge function config

---

## Design Rules Followed

- No new colors, fonts, or theme tokens
- All containers use `glass-card` / `glass-card-bordered`
- All buttons use existing `Button` component variants
- Blur/lock overlay uses CSS `backdrop-filter: blur()` with semi-transparent background
- Mobile-first responsive with existing grid patterns
- Smooth transitions via existing `transition-all duration-300`
- Tone is confident and premium, never aggressive

---

## Implementation Order

```text
Step 1: Database migration (3 tables + RLS)
Step 2: Hooks (useSuperfanMembership, useSuperfanStatus, useTopSupporters, useSuperfanMessages)
Step 3: UI components (StatusPanel, ExclusiveDrops, VIPPerks, TopSupporters, DirectMessages)
Step 4: SuperfanRoom page + route
Step 5: "Enter Superfan Room" button on ArtistProfile
Step 6: create-superfan-checkout edge function
Step 7: Webhook updates for superfan subscriptions
```
