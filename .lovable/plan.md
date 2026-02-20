

# Mobile Compatibility Fix for Edge Functions

## What's Working
All 37 edge functions are deployed, accept requests, and handle CORS preflight (OPTIONS). The native app can reach them.

## What Needs Fixing

### 1. Incomplete CORS Headers (17 functions)
17 older functions use a short CORS header list that's missing the Supabase client platform headers. This can cause failed requests on certain mobile WebView versions.

**Functions to update:**
- artist-payout-status
- award-loyalty-points
- check-subscription
- create-checkout
- create-connect-account
- customer-portal
- delete-account
- download-track
- fan-reengagement
- get-wallet-balance
- pause-subscription
- process-pending-payouts
- purchase-credits
- send-push-notification
- spend-credits
- stripe-webhook
- validate-tier-change

Each will get the full header string:
`authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version`

### 2. Missing Mobile Deep Link Detection (2 payment functions)
`create-store-checkout` and `create-superfan-checkout` do not detect the `x-jumtunes-mobile` header. When an artist store purchase or superfan membership is bought from the native app, the Stripe success/cancel URLs point to the website instead of back to the app.

**Fix:** Add mobile detection to both functions so they return `jumtunes://` URLs when the request comes from the native app.

### 3. Client-Side: Missing Mobile Headers on Store/Superfan Calls
The hooks that call `create-store-checkout` and `create-superfan-checkout` (likely `useStoreCheckout` and `useSuperfanMembership`) need to send the `x-jumtunes-mobile` header, and use `openPaymentUrl` instead of `window.location.href` for native compatibility.

## Technical Summary

- Update CORS headers in 17 edge function files (single line change each)
- Add `x-jumtunes-mobile` detection to 2 checkout functions (3-4 lines each)
- Update 2 client hooks to pass `getMobileHeaders()` and use `openPaymentUrl()`
- Redeploy all modified functions

