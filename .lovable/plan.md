

# Update All Subscribers: 15 AI Credits + 30-Day Trial

## What's Changing
1. **Reset all existing users** to 15 AI credits and a 30-day trial starting now
2. **Update the new-user triggers** so future signups also get 15 credits and 30-day trials (instead of 50 credits / 3-month trials)

## Current State
- 70 users on `trialing` status with various trial end dates (some April, some May 2026)
- All wallets currently show 0 AI credits (already spent or never received)
- New user trigger grants 50 AI credits and 3-month trial

## Implementation

### 1. Data update (SQL via insert tool)
Run two UPDATE statements:
- **Wallets**: `UPDATE credit_wallets SET ai_credits = 15` — reset all users to 15 credits
- **Subscriptions**: `UPDATE subscriptions SET trial_ends_at = NOW() + INTERVAL '30 days', status = 'trialing', updated_at = NOW() WHERE status IN ('trialing', 'canceled')` — reset all trials to 30 days from now

### 2. Migration: Update triggers for future users
- Change `handle_new_user_wallet()` to grant **15** AI credits instead of 50
- Change `handle_new_user_subscription()` to use `INTERVAL '30 days'` instead of `INTERVAL '3 months'`

### 3. Update frontend display
- Update the memory/docs references from "50 credits" and "3-month trial" to "15 credits" and "30-day trial" where shown in UI copy (Subscription page, case study, etc.)

