

## Fix 6 Issues: Edge Functions, Navbar, Edit Profile, Scroll-to-Top, JumBot Scroll Lock

### 1. Fix `npm:` imports in 5 edge functions

5 functions use `npm:@supabase/supabase-js@2.57.2` which fails in the edge runtime. Change to `https://esm.sh/@supabase/supabase-js@2.57.2` (matching all other functions).

**Files**: `supabase/functions/qa-admin/index.ts`, `process-message-expiry/index.ts`, `purchase-message-credits/index.ts`, `refund-store-order/index.ts`, `send-paid-message/index.ts`

### 2. Fix mobile menu displacing navbar header

The mobile menu (line 400-651) renders inline inside the `<nav>`, pushing content down. Change it to `position: fixed` with `top` calculated below the navbar, so it overlays instead of displacing.

**File**: `src/components/layout/Navbar.tsx` — change the mobile nav `<div>` at line 401 from `relative` to `fixed inset-x-0` with `top: calc(4rem + env(safe-area-inset-top))`.

### 3. Add "Edit Profile" to desktop dropdown

The desktop dropdown (lines 267-364) has no "Edit Profile" option. Add a `DropdownMenuItem` with `onClick={() => setIsProfileOpen(true)}` after "Account Settings" (line 356), before the Sign Out separator. Import `Edit` icon or reuse `User`.

**File**: `src/components/layout/Navbar.tsx`

### 4. Scroll to top on route change

Add a `ScrollToTop` component using `useLocation` + `useEffect` to call `window.scrollTo(0, 0)` on pathname change. Place it inside `<BrowserRouter>` in `RouterContent`.

**Files**: Create `src/components/ScrollToTop.tsx`, edit `src/App.tsx` (add import + `<ScrollToTop />` at line 100).

### 5. Lock body scroll when JumBot is open on mobile

Add a `useEffect` in `JumBot` (around line 184) that sets `document.body.style.overflow = 'hidden'` when the chat is open, and restores on close/unmount. Same pattern as Navbar line 55-64.

**File**: `src/components/jumbot/JumBot.tsx`

### 6. AI Generator — resolved by fix #1

The `npm:` import breakage cascades to all edge function deployments. Fixing #1 unblocks the AI generator.

---

### Files Changed

| File | Change |
|---|---|
| 5 edge function `index.ts` files | `npm:` → `https://esm.sh/` import |
| `src/components/layout/Navbar.tsx` | Fixed-position mobile menu; Edit Profile in desktop dropdown |
| `src/components/ScrollToTop.tsx` | New — scroll to top on route change |
| `src/App.tsx` | Import + render `<ScrollToTop />` |
| `src/components/jumbot/JumBot.tsx` | Body scroll lock when open |

