
Root cause (why you still see old UI):
1) Your current guard compares `localStorage.app-build` to `__BUILD_TIMESTAMP__` from the loaded JS bundle.
2) When an old service worker serves an old bundle, that bundle contains the old timestamp.
3) So the comparison says “match” and does not trigger cache nuking.
4) Result: old UI can still appear “randomly” depending on which SW/cache controls the navigation.

Implementation plan (permanent fix):
1) Add a network-truth version file
- Generate a `version.json` at build time (timestamp + commit/build id).
- This must represent the currently deployed version, independent of cached JS.

2) Add a pre-render freshness gate in `src/main.tsx`
- Before `createRoot`, fetch `/version.json` with `cache: "no-store"`.
- Compare network version vs local saved version.
- If different: unregister SWs, delete all caches, update saved version, hard reload.
- If same (or offline): continue normal render.

3) Stop serving stale HTML from precache
- In `vite.config.ts`, remove `html` from `globPatterns` precache list.
- Add a navigation runtime strategy (`NetworkFirst`) for document navigations.
- Keep `cleanupOutdatedCaches`, `skipWaiting`, and `clientsClaim`.

4) Add a safety fallback
- If version check fails repeatedly (offline/error), render app after timeout (e.g., 2–3s) so app is still usable.
- Keep logs for: fetched version, saved version, refresh trigger reason.

5) Validate end-to-end across both web and installed PWA
- Deploy once, open app, then deploy again.
- Confirm no old UI paint on reload.
- Confirm `/~oauth` flow still works and audio cache behavior is unchanged.

Technical details:
- Current issue is not just “cache not cleared”; it’s “comparison uses possibly stale code.”
- Fix is to compare against a network-fetched deployment version before React renders.
- This decouples freshness detection from whatever bundle the old SW served.
- Using NetworkFirst for navigations reduces stale `index.html` reuse while preserving PWA behavior.
