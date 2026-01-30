
# Fix: Withdrawal Setup Button Not Working

## Problem Identified
The "Continue Setup" / "Complete Withdrawal Setup" button for Stripe Connect onboarding is not working because:

1. **Popup Blocker Issue**: The `startOnboarding` function in `useStripeConnect.ts` uses `window.open(url, "_blank")` after an async API call. Browsers detect this as a non-user-initiated popup and block it silently.

2. **Mobile Incompatibility**: The code doesn't use the `openExternalUrl` utility from `platformBrowser.ts`, which is required for the Capacitor native app to open external URLs properly on iOS/Android.

## Solution
Update `useStripeConnect.ts` to use the `openExternalUrl` helper (same pattern as `useWallet.ts`), which:
- Handles popup blocker issues by using proper async/await patterns
- Works correctly on both web and native mobile platforms

## Technical Changes

### File: `src/hooks/useStripeConnect.ts`

**Add import:**
```typescript
import { openExternalUrl } from "@/lib/platformBrowser";
```

**Update the `startOnboarding` function (around line 83-85):**
```typescript
// Before:
if (data?.url) {
  window.open(data.url, "_blank");
  return data.url;
}

// After:
if (data?.url) {
  await openExternalUrl(data.url);
  return data.url;
}
```

## Why This Works

1. **`openExternalUrl` utility** already handles both platforms:
   - On **web**: Uses `window.open(url, "_blank")` but within the proper context
   - On **native apps**: Uses Capacitor's `Browser.open()` plugin

2. **Consistency**: This matches the pattern used in `useWallet.ts` for credit purchases, which is working correctly.

## Additional Consideration (Optional Enhancement)

For web browsers with aggressive popup blockers, we could also consider opening the URL in the same tab using `window.location.href = url` for critical payment flows. However, the `openExternalUrl` approach should resolve the immediate issue.

## Files to Modify
- `src/hooks/useStripeConnect.ts` (1 file, 2 lines changed)

## Testing Steps
1. Log in as an artist with pending Stripe onboarding
2. Navigate to Artist Dashboard or Payouts page
3. Click "Complete Withdrawal Setup" or "Continue Setup" button
4. Verify the Stripe onboarding page opens in a new window/tab (web) or external browser (mobile)
5. Test on both desktop browser and mobile app if possible
