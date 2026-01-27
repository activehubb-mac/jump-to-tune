
# Safari Audio Playback Emergency Fix

## Problem Confirmed

Based on the detailed console screenshots you provided, I can now see the exact error sequence:

1. **`NotSupportedError: "The operation is not supported"`** - Safari rejecting the initial play attempt
2. **`AbortError: The operation was aborted`** - The request was killed mid-stream (shown in the stack trace)
3. **`MediaError code: 3`** - MEDIA_ERR_DECODE with message "Media failed to decode"
4. **`Failed to load resource`** - The Supabase audio URL failing to load

This happens on all Safari environments (tab, PWA, Capacitor iOS) but **not** on Chrome.

---

## Root Cause: PWA Service Worker Cache Corruption

The investigation confirms the culprit is the **Workbox service worker audio cache** in your PWA configuration.

### Why It Breaks on Safari

Your current `vite.config.ts` uses:

```typescript
handler: "CacheFirst",  // <-- Problem #1: Serves stale/corrupted cache
cacheableResponse: {
  statuses: [0, 200]    // <-- Problem #2: Caches opaque responses (status 0)
}
```

Safari is extremely strict about:

1. **Range Requests**: Safari sends `Range` headers for audio streaming. When Workbox caches a partial 206 response and later tries to serve it as a full response, Safari aborts the request.

2. **Opaque Responses**: Status `0` responses (from cross-origin requests) cannot be inspected. Workbox caches them blindly, but Safari fails to play corrupted entries.

3. **Cache Persistence After Updates**: When the PWA auto-updates, the new service worker activates but the old `audio-cache` persists with potentially corrupted entries from the previous version.

### Why Chrome Works

Chrome is more forgiving with range request handling and cached audio blobs. It will often play partial/corrupted cache entries that Safari refuses.

---

## Solution: 5-Phase Fix

### Phase 1: Fix PWA Caching Strategy

**File: `vite.config.ts`**

Change the audio caching from `CacheFirst` to `NetworkFirst`:

| Current | Fixed |
|---------|-------|
| `handler: "CacheFirst"` | `handler: "NetworkFirst"` |
| `statuses: [0, 200]` | `statuses: [200]` |
| `maxEntries: 100` | `maxEntries: 50` |
| `maxAgeSeconds: 30 days` | `maxAgeSeconds: 7 days` |
| No timeout | `networkTimeoutSeconds: 10` |

This ensures:
- Safari always tries the network first (avoids corrupted cache)
- Only successful 200 responses are cached (no opaque/partial responses)
- Shorter cache lifetime reduces corruption risk
- Network timeout provides offline fallback

### Phase 2: Auto-Clear Cache on App Update

**File: `src/main.tsx`**

Add service worker lifecycle handling:

- Listen for `controllerchange` event (new service worker activating)
- When detected, delete the `audio-cache` via `caches.delete('audio-cache')`
- This ensures corrupted caches from old versions don't persist

### Phase 3: Safari-Specific Error Recovery

**File: `src/contexts/AudioPlayerContext.tsx`**

Add intelligent error handling in the audio element:

- Detect `MEDIA_ERR_DECODE` (code 3) and `MEDIA_ERR_NETWORK` (code 2) errors
- On Safari, automatically retry with a cache-busting URL parameter (e.g., `?no-cache=timestamp`)
- This forces Safari to bypass the service worker cache and fetch fresh from network
- Only retry once per URL to prevent infinite loops

### Phase 4: Bypass Service Worker for Safari Audio Fetches

**File: `src/contexts/AudioPlayerContext.tsx`**

In the Safari buffering recovery section:

- Use `fetch(url, { cache: 'no-store', mode: 'cors' })` for Safari
- This explicitly tells the browser to bypass all caches (including service worker)
- Ensures the recovery mechanism fetches fresh data directly from Supabase

### Phase 5: Manual Cache Clear Button

**File: `src/pages/AccountSettings.tsx`**

Add a troubleshooting option for users:

- "Clear Audio Cache" button that:
  - Deletes `audio-cache` via `caches.delete()`
  - Clears localStorage for recently played/viewed
  - Reloads the page
- This gives stuck users an immediate recovery path

---

## Files to Modify

| File | Changes |
|------|---------|
| `vite.config.ts` | Change `CacheFirst` → `NetworkFirst`, remove status 0, add timeout, add cache key plugin |
| `src/main.tsx` | Add service worker `controllerchange` listener to clear audio cache on update |
| `src/contexts/AudioPlayerContext.tsx` | Add Safari error retry with cache-busting, use `cache: 'no-store'` for recovery fetches |
| `src/pages/AccountSettings.tsx` | Add "Clear Audio Cache" troubleshooting button |

---

## Technical Details

### vite.config.ts Changes

```typescript
runtimeCaching: [
  {
    urlPattern: /^https:\/\/ezamzkycxqrstuznqaha\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
    handler: "NetworkFirst",  // Changed from CacheFirst
    options: {
      cacheName: "audio-cache",
      networkTimeoutSeconds: 10,  // Fallback to cache after 10s
      expiration: {
        maxEntries: 50,  // Reduced from 100
        maxAgeSeconds: 60 * 60 * 24 * 7  // 7 days instead of 30
      },
      cacheableResponse: {
        statuses: [200]  // Removed status 0
      }
    }
  }
]
```

### src/main.tsx Changes

```typescript
// Clear audio cache when new service worker activates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if ('caches' in window) {
        try {
          await caches.delete('audio-cache');
          console.log('[PWA] Audio cache cleared on update');
        } catch (e) {
          console.warn('[PWA] Failed to clear audio cache:', e);
        }
      }
    });
  });
}
```

### AudioPlayerContext.tsx Error Handler

```typescript
audio.addEventListener("error", (e) => {
  const error = audio.error;
  
  // Safari-specific: Retry with cache-busting on decode/network errors
  if (isSafari && 
      (error?.code === MediaError.MEDIA_ERR_DECODE || 
       error?.code === MediaError.MEDIA_ERR_NETWORK)) {
    const currentSrc = audio.src;
    if (currentSrc && !currentSrc.includes('_nocache=')) {
      const separator = currentSrc.includes('?') ? '&' : '?';
      audio.src = `${currentSrc}${separator}_nocache=${Date.now()}`;
      audio.play().catch(console.warn);
      return; // Don't stop buffering - retry in progress
    }
  }
  
  // Normal error handling
  setIsPlaying(false);
  setIsBuffering(false);
});
```

---

## Immediate User Workaround

Until the fix is deployed, users can manually clear the corrupted cache:

1. **Safari Tab/PWA**: Safari Settings → Advanced → Website Data → Remove All (or just jumtunes.com)
2. **Capacitor iOS**: Delete and reinstall the app

---

## Verification Steps

After implementation:

1. Deploy the fix
2. Clear Safari's website data for jumtunes.com
3. Hard refresh the page (Cmd+Shift+R)
4. Play any track - should work immediately
5. Reload and play again - should still work (`NetworkFirst` fetches fresh)
6. Test the "Clear Audio Cache" button in Account Settings
