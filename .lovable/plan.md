

## Add Quick "Add Credits" Button to QA Lab

### What
Add a one-click button on the QA Lab header that adds 500 AI credits to the logged-in admin's wallet, so they can run full end-to-end tests without hitting 402 errors.

### How

**File: `src/pages/admin/AdminQALab.tsx`**

1. Import `useAICredits` hook and add a `Coins` icon
2. Add an `handleAddCredits` function that calls `supabase.rpc('add_ai_credits', { p_user_id: user.id, p_credits: 500 })` directly — this uses the existing DB function, no edge function needed, and works because the admin is adding credits to their own wallet
3. Add a button next to "Reset All Data" showing current balance and a "Add 500 Credits" action
4. After success, call `refetch()` from `useAICredits` to update the displayed balance

### UI
The header will show: `[current balance chip] [Add 500 Credits button] [Reset All Data button]`

