

# Stripe Integration & Legacy Migration — Assessment

## Already Built

Nearly everything requested is **already implemented**:

| Feature | Status | Location |
|---------|--------|----------|
| Legacy migration with fan safeguards | Done | `migrate-legacy-subscriptions/index.ts` |
| migration_logs table | Done | Migration `20260306074329` |
| Fan account skip logic | Done | Checks `role = fan`, increments `skipped_fans` |
| Wallet USD → AI credit conversion (1:10) | Done | Migration function handles `credit_wallets.balance_cents` |
| founding_user flag | Done | Set during migration |
| AI credit wallet (credit_wallets table) | Done | Has `ai_credits`, `balance_cents` columns |
| AI credit deduction (atomic RPC) | Done | `deduct_ai_credits` function |
| AI credit addition (atomic RPC) | Done | `add_ai_credits` function |
| ai_credit_usage table | Done | Migration `20260305031156` |
| ai_credit_costs table | Done | Configurable per-tool costs |
| Stripe webhook: credit packs | Done | Handles `ai_credit_pack` metadata |
| Stripe webhook: subscriptions + role sync | Done | Full tier/role management |
| Stripe webhook: monthly credit refresh | Partial | Need to verify `invoice.paid` handler |
| purchase-credits edge function | Done | Product-based packs with Stripe prices |
| Admin dashboard | Done | Users, tracks, finance, reports |
| Credit pack products mapped | Done | All 4 product IDs in webhook + purchase function |

## What's Missing or Needs Attention

### 1. `invoice.paid` handler for monthly credit refresh
The webhook needs to handle `invoice.paid` events to refresh AI credits monthly for subscribers. Let me verify this exists.

### 2. Requested tables already covered differently
- **user_ai_wallet** → Already `credit_wallets` (has `ai_credits`, `balance_cents`, `user_id`)
- **ai_credit_transactions** → Already `ai_credit_usage` (has `user_id`, `action`, `credits_used`, `metadata`, `created_at`)

Creating duplicate tables would fragment the data. The existing schema covers all requested fields.

### 3. Admin credit adjustment UI
Admin can already manage users from `/admin/users`. A manual credit adjustment action may need to be added to the admin UI.

## Plan

### Step 1: Verify invoice.paid handler
Check if the stripe-webhook already handles `invoice.paid` for monthly credit refresh. If not, add it.

### Step 2: Add admin credit adjustment
Add an admin action to manually adjust AI credits for any user from the admin users page.

### Step 3: No new tables
The existing `credit_wallets` and `ai_credit_usage` tables already serve the purpose of the requested `user_ai_wallet` and `ai_credit_transactions`. Creating duplicates would cause data fragmentation and bugs.

### Summary
The Stripe integration, legacy migration, fan protection, wallet conversion, and credit system are **already fully built**. The only gaps are verifying the monthly credit refresh webhook handler and adding admin credit adjustment capability.

