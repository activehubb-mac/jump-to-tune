
# Fix "Complete Withdrawal Setup" Button Not Working

## Problem Summary
Artists report clicking the "Complete Withdrawal Setup" button with no visible result. Edge function logs show the function is being invoked successfully multiple times but the user sees no browser opening or feedback.

## Root Cause Analysis

### Evidence from Logs
- The `create-connect-account` edge function is successfully called (7+ times in quick succession)
- User's Stripe account exists (`acct_1Srs52CZRCFso88t`) with `details_submitted: false`
- The function reaches "User already has Connect account, creating login link" but no subsequent log shows the URL was returned

### Two Issues Identified

**Issue 1: Missing Logs and Silent Failure**
The edge function has a gap in logging - after checking account status and before returning, there's no log confirming the URL was successfully created. If `stripe.accountLinks.create()` fails, the error gets swallowed or the function returns without a URL.

**Issue 2: Mobile Browser Opening Silently Failing**
The frontend uses `openExternalUrl()` which calls `Browser.open()` on native apps. This may fail silently on some devices without any user feedback.

## Solution

### Step 1: Add Better Logging to Edge Function
Add logging after successful URL creation to confirm the function completed:

```text
File: supabase/functions/create-connect-account/index.ts

Changes:
- Add log before returning onboarding link URL
- Add log before returning login link URL  
- Log the actual error message if accountLinks.create fails (currently only logs on retrieve error)
```

### Step 2: Add User Feedback When Opening URL
If the browser opens successfully OR fails, provide visual feedback to the user:

```text
File: src/hooks/useStripeConnect.ts

Changes:
- Show a toast message when the Stripe page is opening ("Opening Stripe setup...")
- Handle errors from openExternalUrl and show feedback if it fails
- Add try-catch around openExternalUrl call
```

### Step 3: Improve Mobile Browser Handling
Update the platformBrowser utility to handle edge cases:

```text
File: src/lib/platformBrowser.ts

Changes:
- Add try-catch around Browser.open with error feedback
- Consider using presentationStyle: "fullscreen" instead of "popover" for better visibility
- Add a fallback to window.open if Capacitor Browser fails
```

### Step 4: Ensure Edge Function Returns URL
Add explicit handling if the Stripe API returns no URL:

```text
File: supabase/functions/create-connect-account/index.ts

Changes:
- Check if accountLink.url exists before returning
- Return an error if URL is missing
- Add log confirming successful account link creation
```

## Technical Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/create-connect-account/index.ts` | Add success logging and URL validation |
| `src/hooks/useStripeConnect.ts` | Add toast feedback and error handling for browser opening |
| `src/lib/platformBrowser.ts` | Improve mobile browser handling with fallback |

## Testing Plan
After implementation:
1. Test on mobile device by clicking "Complete Withdrawal Setup"
2. Verify a toast message appears ("Opening Stripe setup...")
3. Verify Stripe onboarding page opens in external browser
4. Check edge function logs show the URL was created successfully
