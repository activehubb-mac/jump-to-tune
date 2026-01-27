

# iOS Download & Credit Purchase Compatibility Plan

This plan adds proper iOS support for downloading tracks, purchasing credits, and handling deep links when users return from Stripe checkout.

---

## Overview

The current implementation has several gaps for iOS native app compatibility:
- Downloads don't work properly on iOS (Safari blocks programmatic downloads)
- Stripe checkout opens in webview instead of external browser
- Deep links from payment success aren't handled
- No cache invalidation when app resumes after payment

---

## Phase 1: Create Deep Link Handler Hook

### New File: `src/hooks/useDeepLinkHandler.ts`

Create a hook that uses Capacitor's App plugin to intercept `jumtunes://` deep links:

```text
+------------------+     +-------------------+     +------------------+
| Stripe Checkout  | --> | jumtunes://       | --> | useDeepLinkHandler|
| (External Browser)|     | payment-success   |     | parses URL &     |
+------------------+     +-------------------+     | invalidates cache |
                                                   +------------------+
```

Key functionality:
- Listen for `appUrlOpen` events from Capacitor App plugin
- Parse the URL to extract route and query parameters
- Invalidate relevant React Query caches (wallet, subscription, owned-tracks)
- Navigate to the appropriate page using React Router

---

## Phase 2: Create Platform-Aware Browser Utility

### New File: `src/lib/platformBrowser.ts`

Create a utility that:
- Detects if running in Capacitor native app
- Uses `@capacitor/browser` for external URLs on native
- Falls back to `window.open` for web
- Adds `x-jumtunes-mobile` header for edge function requests

```typescript
// Key functions:
- isNativeApp(): boolean
- openExternalUrl(url: string): Promise<void>
- getMobileHeaders(): Record<string, string>
```

---

## Phase 3: Update useWallet Hook

### File: `src/hooks/useWallet.ts`

Changes:
1. Import platform browser utility
2. Replace `window.open(data.url, "_blank")` with `openExternalUrl(data.url)`
3. Add `x-jumtunes-mobile` header when invoking edge function

```typescript
// Before
if (data?.url) {
  window.open(data.url, "_blank");
}

// After
if (data?.url) {
  await openExternalUrl(data.url);
}
```

Also update the edge function request to include mobile header:
```typescript
headers: {
  Authorization: `Bearer ${session.access_token}`,
  ...getMobileHeaders(),
}
```

---

## Phase 4: Update useDownload Hook

### File: `src/hooks/useDownload.ts`

Changes for iOS download compatibility:

1. **For owned track downloads**: Use Capacitor Filesystem plugin on native, or provide a "Save to Files" option
2. **For Stripe checkout URLs**: Use platform browser utility instead of `window.open`

```typescript
// iOS-compatible download approach
const downloadOwnedTrack = async (trackId: string) => {
  // Get signed URL from edge function
  const { data } = await supabase.functions.invoke("download-track", ...);
  
  if (isNativeApp()) {
    // On iOS: Open in browser which prompts save to Files
    await openExternalUrl(data.downloadUrl);
  } else {
    // Web: Use anchor element approach
    const link = document.createElement("a");
    link.href = data.downloadUrl;
    link.download = data.filename;
    link.click();
  }
};
```

---

## Phase 5: Update Customer Portal Edge Function

### File: `supabase/functions/customer-portal/index.ts`

Add mobile deep link support:

```typescript
// Detect if request is from mobile app
const isMobileApp = req.headers.get("x-jumtunes-mobile") === "true";
const origin = req.headers.get("origin") || "https://jump-to-tune.lovable.app";
const returnUrl = isMobileApp 
  ? "jumtunes://subscription" 
  : `${origin}/subscription`;

const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: returnUrl,
});
```

---

## Phase 6: Integrate Deep Link Handler in App.tsx

### File: `src/App.tsx`

Add the deep link handler to AppContent:

```typescript
function AppContent() {
  useStatusBar();
  useDeepLinkHandler(); // Add this
  
  return (
    // ... existing code
  );
}
```

---

## Phase 7: Update Subscription Page for Mobile Portal

### File: `src/pages/Subscription.tsx`

Update customer portal and checkout functions to use platform browser utility:

```typescript
// Replace window.open and window.location.href with:
await openExternalUrl(url);
```

---

## Files Modified Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useDeepLinkHandler.ts` | CREATE | Handle jumtunes:// deep links |
| `src/lib/platformBrowser.ts` | CREATE | Platform-aware browser utility |
| `src/hooks/useWallet.ts` | MODIFY | Use platform browser for Stripe |
| `src/hooks/useDownload.ts` | MODIFY | iOS-compatible downloads |
| `supabase/functions/customer-portal/index.ts` | MODIFY | Add mobile deep link support |
| `src/App.tsx` | MODIFY | Integrate deep link handler |
| `src/pages/Subscription.tsx` | MODIFY | Use platform browser utility |

---

## Dependencies Required

The following Capacitor plugins may need to be installed:

```json
{
  "@capacitor/app": "^8.0.0",
  "@capacitor/browser": "^8.0.0"
}
```

These are likely already available since Capacitor is configured.

---

## Technical Details

### Deep Link URL Format

```text
jumtunes://payment-success?session_id=xxx&type=credits&credits=990
jumtunes://payment-canceled
jumtunes://subscription
```

### Platform Detection Logic

```typescript
const isNativeApp = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' 
    && (window as any).Capacitor.isNativePlatform();
};
```

### Cache Invalidation on App Resume

When a deep link is received, invalidate these queries:
- `["wallet"]` - Refresh credit balance
- `["subscription"]` - Refresh subscription status
- `["owned-tracks"]` - Refresh owned tracks list
- `["collection-stats"]` - Refresh collection counts

---

## What This Plan Does NOT Touch

- AudioPlayerContext.tsx - Safari audio logic unchanged
- Audio playback functionality
- Database schema or RLS policies
- Existing edge function logic (only adds mobile support)
- UI layouts and styling

---

## Testing Checklist

After implementation, test on iOS:

| Test Case | Expected Result |
|-----------|-----------------|
| Tap "Add Credits" | Opens Stripe in external browser |
| Complete Stripe payment | Returns to app via deep link |
| Wallet balance updates | Shows new credit balance |
| Tap "Download" on owned track | Opens in browser → Save to Files |
| Open Customer Portal | Opens in external browser |
| Return from portal | App resumes at /subscription |

