

## Fix: Suppress "Trial Ended" Modal for Admin Users

### Problem
The `GlobalSubscriptionCheck` shows the "Your Trial Has Ended" modal to all logged-in users without an active subscription — including admins. Admins don't need subscriptions and shouldn't see this modal.

### Fix

**File: `src/components/subscription/GlobalSubscriptionCheck.tsx`**

- Import and use `useAdminAccess` hook
- Wait for admin check to finish loading before evaluating
- Skip showing the modal if user is an admin

One file, ~5 lines changed.

