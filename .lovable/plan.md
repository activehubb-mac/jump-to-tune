
# Superfan AI Retention System

A comprehensive fan retention engine that adds loyalty leveling, a premium Fan Vault, AI-driven insights for artists, and smart reward triggers -- all built on top of the existing Store, Superfan, and purchase infrastructure.

---

## Phase 1: Database Migration

### New Tables

**fan_loyalty** (one row per user-artist pair)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| fan_id | uuid | references profiles |
| artist_id | uuid | references profiles |
| points | integer | default 0 |
| level | text | 'listener', 'supporter', 'insider', 'elite', 'founding_superfan' |
| show_public | boolean | default false (fan toggle) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Fans manage their own rows. Artists can view rows for their artist_id. Public can view rows where show_public = true.

**artist_superfan_settings** (one row per artist)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | unique, references profiles |
| loyalty_enabled | boolean | default false |
| public_leaderboard | boolean | default false |
| show_top_supporters | boolean | default true |
| show_founding_fans | boolean | default true |
| custom_level_names | jsonb | nullable, override default level names |
| created_at / updated_at | timestamptz | |

RLS: Artists manage their own. Public can view where loyalty_enabled = true.

**activity_feed**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| artist_id | uuid | |
| type | text | 'new_drop', 'limited_release', 'superfan_exclusive', 'merch_restock', 'announcement' |
| title | text | |
| description | text | nullable |
| metadata | jsonb | nullable (product_id, track_id, etc.) |
| created_at | timestamptz | |

RLS: Public can view all. Artists can insert/update/delete their own.

---

## Phase 2: Edge Function -- AI Fan Insights

### New: `supabase/functions/fan-insights/index.ts`

Uses Lovable AI (Gemini Flash) to analyze fan data for an artist and return structured insights.

**Input:** artist_id (from authenticated artist)

**Logic:**
1. Query purchases, store_orders, superfan_subscribers for the artist
2. Aggregate per-fan: purchase count, total spent, last purchase date, subscription status, loyalty level
3. Send summary to Lovable AI with a structured tool call to classify fans into:
   - Top 10 Supporters (by total spend)
   - Rising Supporters (increasing purchase frequency)
   - At-Risk Subscribers (no activity in 30+ days)
   - Fans Near Next Level (within 20% of level threshold)
4. Return structured JSON

**Rate limit handling:** Surface 429/402 errors to the client.

---

## Phase 3: Loyalty Points Engine

### New: `supabase/functions/award-loyalty-points/index.ts`

Called by the existing `stripe-webhook` after a purchase/subscription event.

**Point awards:**
- Purchase digital product: 10 points
- Buy merch: 15 points
- Subscribe to Superfan: 50 points
- Buy limited edition: 25 points
- Early release purchase: 20 points

**Level thresholds:**
- Listener: 0 points
- Supporter: 50 points
- Insider: 150 points
- Elite: 500 points
- Founding Superfan: 1000 points

When a fan crosses a level threshold, insert a notification into the `notifications` table with type `level_up`.

---

## Phase 4: Fan Vault Page

### New route: `/vault`

### New page: `src/pages/FanVault.tsx`

Premium-feeling dashboard for fans showing:

**Sections:**
1. **Vault Header** -- Fan's loyalty level badge, total points, level progress bar
2. **Digital Collection** -- Purchased tracks displayed as a grid of "CD cases" (cover art with edition numbers)
3. **Limited Editions** -- Filtered view of purchases with edition numbers, highlighted with scarcity badges ("Edition 247 of 1000")
4. **Superfan Subscriptions** -- Active artist subscriptions with tier badges
5. **Order History** -- Store orders with status badges
6. **Loyalty Level Card** -- Current level, points to next level, progress visualization

All sections use existing `glass-card` / `glass-card-bordered` containers.

### New components:
- `src/components/vault/VaultHeader.tsx`
- `src/components/vault/DigitalCollection.tsx`
- `src/components/vault/LimitedEditions.tsx`
- `src/components/vault/LoyaltyLevelCard.tsx`
- `src/components/vault/VaultOrderHistory.tsx`

---

## Phase 5: Fan Visibility Toggle

### Modified: `src/pages/AccountSettings.tsx`

Add a "Superfan Visibility" card:
- Toggle: "Show My Superfan Status" (updates `fan_loyalty.show_public`)
- Description: When enabled, your level badge appears on artist pages and you are eligible for Top Supporter leaderboards

---

## Phase 6: Artist Superfan Center

### New tab in ArtistStore.tsx: "Superfan Center"

Add a 5th tab to the existing Store & Earnings page.

### New component: `src/components/store/SuperfanCenterTab.tsx`

**Sections:**
1. **Loyalty System Toggle** -- Enable/disable loyalty for your fans
2. **Leaderboard Settings** -- Toggle public leaderboard, top supporters display, founding fan recognition
3. **Custom Level Names** -- Optional overrides for default level names
4. **Superfan Insights** (powered by AI):
   - Top 10 Supporters cards
   - Rising Supporters list
   - At-Risk Subscribers (inactive 30+ days)
   - Fans Near Next Level
5. **Create Superfan-Only Drop** -- Link to product creation with `is_exclusive` pre-checked

---

## Phase 7: Activity Feed on Artist Profile

### Modified: `src/pages/ArtistProfile.tsx`

Add "Activity" tab alongside Tracks and Store tabs.

### New component: `src/components/artist/ActivityFeed.tsx`

Displays recent activity_feed entries for the artist:
- New Drops, Limited Releases, Superfan Exclusives, Merch Restock, Announcements
- Each entry uses a glass-card with icon, title, timestamp
- Follows existing card patterns

---

## Phase 8: Smart Notifications

### Modified: `stripe-webhook/index.ts`

After processing a purchase or subscription event:
1. Call `award-loyalty-points` to update points
2. If level-up detected, insert `level_up` notification

### New: `supabase/functions/fan-reengagement/index.ts`

Designed to be called on a schedule (or manually by artist):
- Queries fans with no purchase/activity in 30+ days
- Inserts a soft notification: "New exclusive drop from [Artist Name]"
- Only triggers once per fan per 30-day window (check last notification date)
- No spam -- behavior-based only

---

## Phase 9: AI Personalization (Subtle Suggestions)

### Modified: `src/pages/FanVault.tsx`

Add a "Suggested For You" section at the bottom:
- Query fan's purchase history (genres, artists)
- Use existing `useRecommendedArtists` pattern to suggest:
  - Drops they might like (from followed artists)
  - Similar artists based on purchase behavior
  - Subtle "Become a Superfan" prompt if high purchase frequency but no subscription

No aggressive upselling -- framed as "You might enjoy" with existing glass-card styling.

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useFanLoyalty(fanId, artistId?)` | Fetch loyalty points, level, and progress |
| `useArtistSuperfanSettings(artistId)` | Fetch/manage artist superfan config |
| `useActivityFeed(artistId)` | Fetch activity feed entries |
| `useFanInsights(artistId)` | Trigger and fetch AI insights |

---

## Files Created

1. `src/pages/FanVault.tsx` -- Fan Vault page
2. `src/components/vault/VaultHeader.tsx` -- Level badge and stats
3. `src/components/vault/DigitalCollection.tsx` -- Purchased tracks grid
4. `src/components/vault/LimitedEditions.tsx` -- Limited edition showcase
5. `src/components/vault/LoyaltyLevelCard.tsx` -- Level progress visualization
6. `src/components/vault/VaultOrderHistory.tsx` -- Order history list
7. `src/components/store/SuperfanCenterTab.tsx` -- Artist superfan management
8. `src/components/artist/ActivityFeed.tsx` -- Public activity feed
9. `src/hooks/useFanLoyalty.ts`
10. `src/hooks/useArtistSuperfanSettings.ts`
11. `src/hooks/useActivityFeed.ts`
12. `src/hooks/useFanInsights.ts`
13. `supabase/functions/fan-insights/index.ts` -- AI analysis
14. `supabase/functions/award-loyalty-points/index.ts` -- Points engine
15. `supabase/functions/fan-reengagement/index.ts` -- Re-engagement notifications

## Files Modified

1. `src/App.tsx` -- Add `/vault` route
2. `src/pages/ArtistStore.tsx` -- Add "Superfan Center" tab
3. `src/pages/ArtistProfile.tsx` -- Add "Activity" tab
4. `src/pages/AccountSettings.tsx` -- Add visibility toggle
5. `src/pages/FanDashboard.tsx` -- Add "My Vault" quick action
6. `src/components/layout/Navbar.tsx` -- Add Vault link in fan menu
7. `supabase/functions/stripe-webhook/index.ts` -- Trigger loyalty point awards
8. `supabase/config.toml` -- Register new edge functions

---

## Implementation Order

```text
Step 1: Database migration (3 tables + RLS)
Step 2: Hooks (useFanLoyalty, useArtistSuperfanSettings, useActivityFeed, useFanInsights)
Step 3: Fan Vault page + components
Step 4: award-loyalty-points edge function
Step 5: Superfan Center tab on Artist Store
Step 6: fan-insights AI edge function
Step 7: Activity Feed on Artist Profile
Step 8: Visibility toggle in Account Settings
Step 9: fan-reengagement edge function
Step 10: Smart notifications in stripe-webhook
Step 11: Route + navigation integration
```

---

## Design Rules

- All UI uses existing glass-card / glass-card-bordered containers
- Existing Button, Badge, Card, Tabs components only
- No new colors, fonts, or theme tokens
- Mobile-first responsive using existing grid patterns
- Subtle, non-aggressive AI suggestions
- Position as enhancement, not replacement for streaming
