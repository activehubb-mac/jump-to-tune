

# Fix: Fan Account Credit Top-Up Returning Non-2xx Error

## Root Causes Identified

### 1. Invalid Stripe API Version
The `purchase-credits` edge function uses `apiVersion: "2025-11-17.clover"` which is not a valid Stripe API version. The latest stable version is `2025-08-27.basil`. This can cause Stripe SDK initialization failures or checkout session creation errors for some requests.

### 2. Unsafe Email Access
The code uses `user.email!` (non-null assertion) when creating the Stripe checkout session. If a fan account was created without an email (e.g., via phone or social login), this will pass `undefined` to Stripe, causing it to throw an error.

### 3. Poor Error Visibility
All errors return HTTP 500, and the frontend only sees the generic "edge function returned a non-2xx status code" message from the Supabase SDK. The actual error details from Stripe are lost.

## Changes

### File: `supabase/functions/purchase-credits/index.ts`

| Change | Detail |
|--------|--------|
| Fix Stripe API version | Change from `2025-11-17.clover` to `2025-08-27.basil` |
| Safe email handling | Add a check for `user.email` before using it, return a clear error if missing |
| Better error responses | Return 400 for validation errors instead of 500 so the SDK error message is more useful |

### File: `src/hooks/useWallet.ts`

| Change | Detail |
|--------|--------|
| Better error extraction | Parse the actual error message from the edge function response body instead of showing the generic SDK error |

## Technical Details

**Edge function fix** -- the key changes in `purchase-credits/index.ts`:

```typescript
// Fix API version
apiVersion: "2025-08-27.basil"

// Safe email check
if (!user.email) {
  return new Response(
    JSON.stringify({ error: "No email associated with your account" }),
    { headers: corsHeaders, status: 400 }
  );
}

// Validation errors return 400, not 500
```

**Frontend fix** -- in `useWallet.ts`, extract the real error:

```typescript
if (error) {
  // Try to get the actual error message from the response
  const errorMsg = error.context?.body 
    ? JSON.parse(error.context.body).error 
    : error.message;
  showFeedback({ type: "error", title: "Purchase Failed", message: errorMsg });
}
```

