

# Fix: Subscription Expiry Enforcement

## What's Actually Happening

Your subscription flow worked correctly during testing -- Stripe processed the downgrade. But the local database was never updated to reflect the cancellation, and the `check-subscription` edge function has two gaps:

1. **Silent Stripe error**: When retrieving `sub_1Spvh2EKeZaBsSwjimemSDva` from Stripe fails (subscription canceled/removed), the error is caught and silently ignored
2. **Blind fallback**: The fallback path (line 172) trusts the DB `status: "active"` without checking if `current_period_end` has passed

## The Fix

**File: `supabase/functions/check-subscription/index.ts`**

### Change 1: Handle Stripe retrieval failures properly

When Stripe returns an error for a stored subscription ID, instead of silently falling through, treat it as an expired/invalid subscription:

- If Stripe says the subscription doesn't exist or is invalid, mark as expired
- Update the local DB to clear the stale status so future checks are faster

### Change 2: Add date validation to the fallback path

Before returning the fallback local data at line 172, check:

```text
IF current_period_end has passed AND trial_ends_at has passed:
  -> Update DB status to "canceled"
  -> Return subscribed: false, status: "canceled"
ELSE IF only current_period_end has passed but trial still active:
  -> Return trial status with remaining days
ELSE:
  -> Return current local data as-is (it's still valid)
```

### Change 3: Sync DB on Stripe error

When the Stripe fetch fails for a known subscription ID, update the local record:

```text
UPDATE subscriptions 
SET status = 'canceled', stripe_subscription_id = NULL
WHERE user_id = user.id
```

This prevents repeated failed Stripe lookups on every check.

## What This Fixes

- Your account will immediately show as expired on next check
- The `SubscriptionExpiredModal` will appear as designed
- Premium features (queue, shuffle, repeat, sorting) will show lock icons
- Users who tested proration/downgrade flows won't get stuck in a "forever active" state
- Future Stripe errors won't silently grant access

## Scope

- **One file modified**: `supabase/functions/check-subscription/index.ts`
- **No database migration needed**
- **No frontend changes needed** -- the existing expired modal, lock icons, and feature gating are already wired up and waiting for the correct `subscribed: false` response
- Edge function will be redeployed automatically

