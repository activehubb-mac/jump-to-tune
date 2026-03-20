

## Root Cause: Why Old UI Still Appears

The current version check in `main.tsx` compares `localStorage('app-version')` against network-fetched `version.json`. The flaw:

1. User visits after deploy → version.json returns `"abc123"` → saved to localStorage → app renders fine.
2. Later, old service worker serves **cached old HTML + old JS** from its precache/navigation cache.
3. Old JS runs version check → fetches version.json → gets `"abc123"` → matches localStorage → **no reload triggered**.
4. Old UI renders.

The check only catches the **first visit** after a deploy. After that, the saved version matches the network version, so stale cached bundles slip through.

## Fix: Dual-Check — Network Version vs Embedded Build Version

Embed the build version string directly into the JS bundle via Vite's `define`. Then in `main.tsx`, compare **both**:
- Network version.json `v` vs `__APP_BUILD_VERSION__` (baked into the bundle)
- If they differ → this bundle is stale → nuke caches + reload

This way, even if localStorage already has the correct version saved, a stale cached bundle will detect that its own embedded version doesn't match the network truth.

## Changes

### 1. `vite.config.ts`
- Add `__APP_BUILD_VERSION__: JSON.stringify(buildVersion)` to `define` block (alongside existing `__BUILD_TIMESTAMP__`).

### 2. `src/main.tsx`
- Declare `__APP_BUILD_VERSION__` global.
- In `checkVersion()`, after fetching version.json, compare `v` against `__APP_BUILD_VERSION__` (not just localStorage).
- If `v !== __APP_BUILD_VERSION__` → stale bundle → nuke caches + reload immediately.
- Keep the localStorage check as a secondary safety net.

### 3. `src/vite-env.d.ts`
- Add type declaration for `__APP_BUILD_VERSION__`.

```text
Flow after fix:

Old SW serves cached HTML + old JS
  → old JS has __APP_BUILD_VERSION__ = "old123"
  → fetches version.json → gets "new456"
  → "old123" !== "new456" → nuke + reload
  → fresh HTML + JS loads → matches → render
```

### Files
- `vite.config.ts` — add build version to `define`
- `src/main.tsx` — compare embedded version vs network version
- `src/vite-env.d.ts` — type declaration

