

# Fix: Artist Dashboard Showing "Fan Plan" Instead of Artist Plan

## Problem

Your account has two roles in the database: **artist** and **admin**. The `check-subscription` edge function queries the `user_roles` table with `.single()`, which crashes when multiple rows exist. This causes the role lookup to fail silently, defaulting to `"fan"`. Since the subscription `tier` column was never corrected (it was set to `"fan"` at signup), the banner displays "Fan Plan."

## Root Cause

```text
user_roles table for your account:
  - artist (primary role)
  - admin  (privilege role)

check-subscription query: .single() --> FAILS (2 rows returned)
actualRole fallback: "fan"
subscription.tier: already "fan" --> no mismatch detected --> no fix applied
```

## Fix

### 1. Update `check-subscription` edge function (lines 93-99)

Change the `user_roles` query to exclude the `admin` role and use `.maybeSingle()`:

```typescript
const { data: roleData } = await supabaseClient
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .neq("role", "admin")
  .maybeSingle();
```

This follows the established multi-role pattern already documented in the codebase. It safely handles users with multiple roles by filtering out admin (which is a privilege, not a subscription tier) and using `.maybeSingle()` to avoid the crash.

### 2. Fix existing data

Run a one-time database update to correct your subscription tier immediately (so you don't have to wait for the auto-sync to run):

```sql
UPDATE subscriptions SET tier = 'artist' WHERE user_id = '81fd4edb-eff8-4921-a6cf-79cfc2e6d68e';
```

### 3. Re-deploy the edge function

Deploy the updated `check-subscription` function so the fix applies to all future requests.

---

## Files Modified

1. `supabase/functions/check-subscription/index.ts` -- Fix `.single()` to `.neq("role", "admin").maybeSingle()`

## Result

- Banner will correctly show **"Artist Plan"** with the Trial badge
- The auto-sync logic will work for any future multi-role users
- No visual or theme changes
