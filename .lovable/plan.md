

# Remove "For You" Feature

## Changes

1. **`src/components/layout/Navbar.tsx`** — Remove the `{ href: "/for-you", label: "For You", ... }` entry from the nav links array.

2. **`src/App.tsx`** — Remove the `ForYou` import and the `<Route path="/for-you" ... />` route.

3. **`src/pages/FanDashboard.tsx`** — Remove the "For You" button/link (around line 373-377).

4. **Delete files**:
   - `src/pages/ForYou.tsx`
   - `src/hooks/useForYouPlaylist.ts`

