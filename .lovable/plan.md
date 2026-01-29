
# Fix: Make Withdrawal Setup Visible on Mobile

## Problem Identified

The **EarningsWidget** (which contains the "Set Up Withdrawals" button) is inside a sidebar that has `hidden lg:block` class (line 362 of LabelDashboard.tsx). This means:

- **Desktop (lg and above)**: Sidebar is visible with earnings widget
- **Mobile/Tablet**: Sidebar is completely hidden - no way to see or set up withdrawals

## Solution

Add a mobile-friendly earnings/withdrawal banner **in the main content area** that appears on mobile and tablet screens. This will be placed right after the Subscription Status Banner.

## What You Will See

**On mobile (when not connected to Stripe):**
```
+------------------------------------------+
|  Set Up Withdrawals                      |
|  Connect your account to receive         |
|  earnings from your roster's sales       |
|                          [Set Up Now ->] |
+------------------------------------------+
```

**On mobile (when connected):**
```
+------------------------------------------+
|  Pending: $XX.XX                         |
|  All Time: $XX.XX         [Payouts ->]   |
+------------------------------------------+
```

## Technical Changes

| File | Change |
|------|--------|
| `src/pages/LabelDashboard.tsx` | Add a mobile earnings section using `useStripeConnect` hook, visible only on screens smaller than `lg` breakpoint |

### Implementation Details

1. Import `useStripeConnect` hook (already imported via EarningsWidget, but need to use directly)
2. Add a new section after line 141 (after SubscriptionStatusBanner) with class `lg:hidden` to show only on mobile/tablet
3. The section will:
   - Show loading state while fetching Stripe status
   - Display "Set Up Withdrawals" CTA when not connected
   - Display "Complete Setup" when partially connected
   - Show pending earnings summary with link to payouts when fully connected
4. Use existing styling patterns (glass-card, accent colors)
