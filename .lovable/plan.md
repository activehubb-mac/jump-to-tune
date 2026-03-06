

# Full Cross-Device Audit for JumTunes

After thoroughly reviewing the codebase -- routing, auth, layout, PWA config, Capacitor setup, safe-area handling, edge functions, Stripe flows, audio player, wallet, and AI tools -- here is the status and one actionable fix.

## What's Working Correctly

| Area | Status | Notes |
|------|--------|-------|
| **Routing** (40+ routes) | OK | All pages registered in App.tsx, 404 catch-all present |
| **Auth flow** | OK | Sign up/in, role assignment, profile fetch, email verification |
| **Safe-area insets** | OK | Navbar, Layout, GlobalAudioPlayer, FullscreenPlayer, Sheet, Drawer all use `env(safe-area-inset-*)` |
| **Mobile menu** | OK | Body scroll lock, touch-manipulation, min touch targets (44px) |
| **Capacitor deep linking** | OK | `jumtunes://` scheme handled, cache invalidation on resume |
| **Stripe checkout (mobile)** | OK | `x-jumtunes-mobile` header detected, deep link URLs for success/cancel |
| **Audio player** | OK | Fixed bottom bar with safe-area padding, fullscreen mode, queue |
| **PWA manifest** | OK | Icons, theme color, standalone display, portrait orientation |
| **Wallet & AI credits** | OK | Atomic RPC functions, credit pack purchases, consistent $98 pricing |
| **AI tools** | OK | All 6 tools routed, credit checks, role gating |
| **Subscription system** | OK | Trial tracking, tier management, webhook processing |
| **Edge functions** | OK | All 31 functions registered in config.toml with `verify_jwt = false` |
| **viewport meta** | OK | `viewport-fit=cover` for notch devices |
| **index.html** | OK | PWA meta tags, apple-mobile-web-app-capable, status bar style |

## Issue Found: PWA OAuth Route Not Excluded from Service Worker

The `navigateFallbackDenylist` in `vite.config.ts` only excludes `/_nocache=/` but does **not** exclude `/~oauth`. Per platform requirements, OAuth redirects to `/~oauth` must always hit the network and never be cached by the service worker. This can cause auth callback failures on all devices when the PWA is installed.

### Fix

In `vite.config.ts` line 55, update:

```typescript
navigateFallbackDenylist: [/_nocache=/, /^\/~oauth/],
```

This is a one-line change that prevents the service worker from intercepting OAuth redirects.

## Summary

The platform is architecturally sound across web, PWA, and native (Capacitor). Safe-area insets, touch targets, scroll behavior, Stripe mobile flows, and deep linking are all properly implemented. The single fix above addresses a potential OAuth caching issue that could affect login on installed PWA instances.

