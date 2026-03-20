

## Fix "Failed to add credits" — Root Cause

The `add_ai_credits` RPC returns **HTTP 300 (Multiple Choices)** because there are two overloaded versions of the function in the database — one taking `integer` and one taking `numeric`. PostgREST cannot disambiguate which to call.

### Solution

Change `handleAddCredits` in `AdminQALab.tsx` to call the `qa-admin` edge function's existing `add-credits` action instead of the ambiguous RPC. The edge function uses service-role and doesn't have the overload issue.

### File: `src/pages/admin/AdminQALab.tsx`

Replace the `supabase.rpc('add_ai_credits', ...)` call with:

```typescript
const { data: session } = await supabase.auth.getSession();
const { data, error } = await supabase.functions.invoke('qa-admin', {
  body: { action: 'add-credits', userId: user.id, credits: 500 }
});
if (error || !data?.success) throw new Error(data?.error || 'Failed');
```

This routes through the already-deployed `qa-admin` edge function which calls the RPC via service-role client (no ambiguity issue).

### Alternative long-term fix

Drop the duplicate `add_ai_credits(uuid, integer)` function via migration, keeping only the `numeric` version. This would fix the RPC call globally. Can be done as a follow-up.

