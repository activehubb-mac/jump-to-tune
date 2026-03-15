

## Fix: Always Show Latest UI

### The Problem
When you update your app, some users briefly see the old version because their browser saved a copy of the old files. It's like their phone cached an old photo and keeps showing it instead of the new one.

### What We'll Do (Simple Version)
We'll add **two small changes** so the app automatically refreshes itself when a new version is available — no action needed from users:

1. **In the app settings file** (`vite.config.ts`): Tell the browser "always use the newest version immediately, don't wait"
2. **In the startup file** (`src/main.tsx`): When the app detects a new version arrived, it quietly refreshes the page once so the user sees the latest UI

### What the User Experiences
- They open the app → they see the latest version
- If a new version drops while they're using it → the page refreshes once automatically
- No manual refresh, no "clear cache", no stale UI

### Files Changed
- `vite.config.ts` — 2 lines added
- `src/main.tsx` — 1 line added inside existing code

This is the standard approach used by most modern web apps (Twitter, Spotify Web, etc.) to keep users on the latest version.

