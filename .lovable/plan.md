

## Fix: Stale PWA UI Flashing Old Content

### Root Cause
The service worker precaches all app bundles. Between deploy and SW activation, old cached JS/CSS renders briefly. The `controllerchange` reload in `main.tsx` fixes it *after* the SW activates, but there's a visible flash of stale UI before that happens.

### Changes

**File: `vite.config.ts`**
- Add `cleanupOutdatedCaches: true` to Workbox config — automatically deletes old precache entries when a new SW activates, preventing stale assets from being served
- Add `navigationPreload: true` — uses the network response for navigation requests while the SW boots, reducing stale-cache window

**File: `src/main.tsx`**
- Register for SW `updatefound` event in addition to `controllerchange`
- When a new SW is detected installing, show nothing disruptive but prepare for immediate reload
- Add a guard to prevent double-reload (the current code can trigger `reload()` in a loop if the new SW also triggers `controllerchange`)

**File: `src/App.tsx`** (minor)
- Add a `__BUILD_TIMESTAMP__` log on mount so you can confirm which version is running in console

### Technical Detail

```text
Current flow (has flash):
  Page load → old SW serves cached bundle → renders old UI
  → new SW installs → activates → controllerchange → reload → new UI

Fixed flow:
  Page load → old SW serves cached bundle → renders old UI
  → new SW installs (cleanupOutdatedCaches deletes old entries)
  → activates → controllerchange → reload (once, guarded) → new UI
  
  Net effect: same reload, but old caches are cleaned so
  subsequent loads never flash stale content.
```

### Files
- `vite.config.ts` — add `cleanupOutdatedCaches: true`
- `src/main.tsx` — add reload guard to prevent loops, log build version

