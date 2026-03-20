

## Fix Credit Function Ambiguity — Full Infrastructure Repair

### Root Cause
There are two overloaded versions of both `add_ai_credits` and `deduct_ai_credits` — one taking `integer`, one taking `numeric`. PostgREST cannot disambiguate, returning HTTP 300. Your wallet currently shows 15 credits.

### Step 1 — Drop Legacy Integer Overloads (Migration)

Drop the `integer` versions, keeping only the `numeric` versions (which handle both integer and decimal values):

```sql
DROP FUNCTION IF EXISTS public.add_ai_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.deduct_ai_credits(uuid, integer);
```

This eliminates ambiguity globally — every caller (edge functions, QA lab, direct RPC) will resolve to the single `numeric` overload.

### Step 2 — Harden `qa-admin` Edge Function

Update `supabase/functions/qa-admin/index.ts` line 169-172 to explicitly cast credits to numeric:

```typescript
const { data, error } = await supabaseAdmin.rpc("add_ai_credits", {
  p_user_id: targetUserId,
  p_credits: Number(credits),  // ensure numeric
});
```

Same for `deduct-test-credits` action (line 309-312).

### Step 3 — Redeploy `qa-admin`

The edge function auto-deploys on save.

### Expected Outcome
- "Add 500 Credits" button works immediately
- All QA test suites that call `add-test-credits` or `deduct-test-credits` resolve correctly
- No more HTTP 300 ambiguity errors anywhere in the platform

### Files Changed
| File | Change |
|------|--------|
| Migration (new) | `DROP FUNCTION` for integer overloads |
| `supabase/functions/qa-admin/index.ts` | Explicit `Number()` cast on credit params |

