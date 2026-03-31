

## Fix QA Reset — Test User Cleanup Failing

### Problem
The "Reset All Data" button partially works: dummy assets (204) and test runs (204) delete fine. But `cleanup-all-test-users` fails on all 98 test users (`deleted: 0, errors: 98`). The error from `deleteUser` is silently swallowed — we don't know the specific failure reason.

Additionally, `listUsers({ perPage: 100 })` only fetches 100 users max per page, so if more than 100 test users accumulate, some won't even be attempted.

### Root Cause (likely)
Supabase `auth.admin.deleteUser` fails when the user has related rows in tables with foreign key constraints that don't cascade (e.g., `profiles`, `credit_wallets`, `qa_test_runs.test_user_id`, etc.). The function doesn't clean up dependent data before attempting deletion. It also doesn't log the actual error message, making debugging blind.

### Plan

**File: `supabase/functions/qa-admin/index.ts`**

1. **Log and return error details** in `cleanup-all-test-users` — capture the actual error message from each `deleteUser` call so we can see what's blocking deletion.

2. **Clean up dependent data before deleting users** — before calling `deleteUser`, delete related rows from tables that reference `auth.users`:
   - `profiles` (user_id)
   - `credit_wallets` (user_id)
   - `user_roles` (user_id)
   - `followers` (follower_id or following_id)
   - Any other tables with FK to auth.users

3. **Paginate user listing** — loop through pages to handle >100 test users.

4. **Add error summary to response** — return the first few error messages so the admin UI can display what went wrong.

Changes in `cleanup-all-test-users` case (lines 148-163):

```typescript
case "cleanup-all-test-users": {
  // Paginate to get ALL test users
  let allTestUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    const batch = (users?.users || []).filter((u: any) => u.user_metadata?.is_test_user === true);
    allTestUsers.push(...batch);
    if ((users?.users || []).length < 100) break;
    page++;
  }

  let deleted = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const u of allTestUsers) {
    try {
      // Clean up dependent data first
      await supabaseAdmin.from('credit_wallets').delete().eq('user_id', u.id);
      await supabaseAdmin.from('user_roles').delete().eq('user_id', u.id);
      await supabaseAdmin.from('followers').delete().or(`follower_id.eq.${u.id},following_id.eq.${u.id}`);
      await supabaseAdmin.from('notifications').delete().eq('user_id', u.id);
      await supabaseAdmin.from('profiles').delete().eq('id', u.id);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
      if (error) {
        errors++;
        if (errorMessages.length < 3) errorMessages.push(`${u.email}: ${error.message}`);
      } else {
        deleted++;
      }
    } catch (e: any) {
      errors++;
      if (errorMessages.length < 3) errorMessages.push(`${u.email}: ${e.message}`);
    }
  }

  return new Response(JSON.stringify({
    success: errors === 0,
    deleted,
    errors,
    total: allTestUsers.length,
    errorSamples: errorMessages,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**Also update `cleanup-test-user` (single)** with the same dependent-data cleanup pattern before `deleteUser`.

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/qa-admin/index.ts` | Add dependent data cleanup before user deletion, pagination, error reporting |

### Not Touched
- Payments, credits, AI tools, store, frontend components

