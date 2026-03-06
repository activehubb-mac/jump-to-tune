

# Admin Dashboard Gap Analysis

## Current Admin Tabs (9 tabs)

| Tab | What It Covers |
|-----|---------------|
| Overview | User/track/purchase/revenue stats |
| Home | Homepage section toggles, limits, Spotify embed |
| Users | Search, verify, admin promote, AI credit adjust |
| Tracks | Search, hide/publish, delete |
| Featured | Feature tracks/artists/labels/albums by location |
| Stores | Artist store status, product counts, revenue |
| Finance | Purchases, artist earnings, credit transactions, payout processing |
| Reports | Report queue with status management + Sing Mode video moderation |
| Analytics | 30-day charts: user growth, revenue, track uploads, likes/follows |

## Missing from Admin

### 1. AI Credit Usage Monitoring
No admin view of `ai_credit_usage` or `ai_credit_costs` tables. Admin cannot see which tools are being used, how many credits are consumed platform-wide, or adjust per-tool credit costs. Finance tab shows `credit_transactions` (wallet money) but not AI credit activity.

### 2. GoDJ Session Management
No admin controls for GoDJ sessions (`go_dj_sessions`, `dj_sessions`). Admin cannot moderate, disable, or feature DJ sessions.

### 3. Subscription & Migration Dashboard
No admin visibility into subscription tiers, trial expirations, founding user counts, or migration logs. The `migrate-legacy-subscriptions` function exists but there's no UI to trigger or monitor it.

### 4. Platform Playlists
No admin tab for managing platform-official playlists (`is_platform` flag). Admin must use the Featured tab as a workaround, but that's not the same as curating playlist track order.

### 5. Karaoke/Sing Mode Track Control
Admin can moderate sing mode videos (in Reports), but cannot disable Sing Mode on specific tracks from admin -- only artists can toggle it.

## Plan

### Step 1: Add "AI Credits" tab
- New page `AdminCredits.tsx` showing:
  - Total credits consumed (from `ai_credit_usage`)
  - Breakdown by tool/action (bar chart)
  - Editable `ai_credit_costs` table rows (cost per tool)
  - Recent AI credit usage feed

### Step 2: Add "Subscriptions" tab
- New page `AdminSubscriptions.tsx` showing:
  - Tier distribution (trial/creator/pro/label counts from `credit_wallets` or profiles)
  - Founding user count
  - Migration log viewer (from `migration_logs` table)
  - Button to trigger dry-run / execute migration edge function

### Step 3: Expand Tracks tab with Sing Mode toggle
- Add a Mic icon button on each track row in `AdminTracks.tsx` to toggle `sing_mode_enabled` in `track_karaoke`

### Step 4: Update admin nav
- Add `Zap` icon for AI Credits tab and `CreditCard` icon for Subscriptions tab to `adminNavItems` in `AdminDashboard.tsx`

### Technical Details

- **AdminCredits.tsx**: Queries `ai_credit_usage` with aggregation, `ai_credit_costs` with admin update mutations. The `ai_credit_costs` table currently has no INSERT/UPDATE/DELETE RLS for authenticated users -- will need a migration to add admin policies.
- **AdminSubscriptions.tsx**: Queries `credit_wallets` for tier distribution, `migration_logs` for history. Will invoke `migrate-legacy-subscriptions` edge function via `supabase.functions.invoke()`.
- **Sing Mode admin toggle**: Requires checking if `track_karaoke` row exists for a track, then updating `sing_mode_enabled`. Will need an admin RLS policy on `track_karaoke` for updates.
- **New migration**: Add RLS policies for admin access to `ai_credit_costs` (ALL for admin role) and `track_karaoke` (UPDATE for admin role).

