

## Problem

The PWA service worker (`registerType: "autoUpdate"`) caches the app shell (JS/CSS/HTML). When a new build deploys, the old service worker can serve stale cached assets until it activates. The current `main.tsx` only handles `controllerchange` for audio cache — it doesn't force a page reload when a new service worker takes over, so users can see old UI until they manually refresh.

## Plan

### 1. Force reload on service worker update (`src/main.tsx`)
- After the new service worker activates and `controllerchange` fires, call `window.location.reload()` to guarantee the fresh assets load immediately
- This is the standard pattern for `autoUpdate` PWAs to prevent stale UI

### 2. Add `skipWaiting` to workbox config (`vite.config.ts`)
- Add `skipWaiting: true` and `clientsClaim: true` to the workbox config so the new service worker activates instantly instead of waiting for all tabs to close
- This eliminates the window where old cached assets can be served

### Files to modify
- `src/main.tsx` — add `window.location.reload()` inside the `controllerchange` handler
- `vite.config.ts` — add `skipWaiting: true` and `clientsClaim: true` to the workbox options

