

## Permanent Fix: Eliminate Stale PWA UI Flash

### Why Current Fix Is Insufficient

The existing `skipWaiting` + `cleanupOutdatedCaches` + reload-on-`controllerchange` approach works **after** the new service worker activates. But the old SW serves stale precached `index.html` and JS bundles on the **initial navigation** — that's the flash. The reload happens seconds later, but the user already saw old UI.

### Root Cause

Workbox precache serves `index.html` from cache (CacheFirst) for all navigation requests. When a new deploy lands, the old SW still controls the page and serves the old cached HTML until the new SW finishes installing and activating.

### Permanent Solution: Build-Version Cache Buster

Add a version check in `main.tsx` that runs **before React renders**. If the stored build version doesn't match the current one, nuke all caches and reload immediately — before any UI paints.

### Changes

**File: `src/main.tsx`**
- Before `createRoot`, compare `__BUILD_TIMESTAMP__` against `localStorage.getItem('app-build')`
- If mismatch: clear all caches via `caches.keys()` + `caches.delete()`, unregister old SW, store new timestamp, reload — and **skip rendering** (the page will reload with fresh assets)
- If match: render normally
- This ensures on first visit after a deploy, the app never paints stale UI

```text
Flow after fix:
  Page load → old SW serves old bundle → main.tsx runs
  → __BUILD_TIMESTAMP__ ≠ localStorage → clear all caches → reload
  → fresh load from network → new SW installs → stores new timestamp → renders new UI

Subsequent loads:
  → timestamps match → render immediately (no flash, no reload)
```

**File: `vite.config.ts`**
- No changes needed — existing config is correct

### Files
- `src/main.tsx` — add build-version gate before render

