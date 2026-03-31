

## Fix 6 Issues: QA Reset, Navbar Layout, Edit Profile, Scroll-to-Top, JumBot Scroll Lock, AI Generator

### 1. Fix `npm:` imports in 5 edge functions (fixes QA reset + AI generator)

**Root cause**: 5 edge functions use `npm:@supabase/supabase-js@2.57.2` which fails in the edge runtime. All other functions use `https://esm.sh/`.

**Fix**: Change import in these files from `npm:` to `https://esm.sh/`:
- `supabase/functions/qa-admin/index.ts` (line 2)
- `supabase/functions/process-message-expiry/index.ts` (line 2)
- `supabase/functions/purchase-message-credits/index.ts` (line 3)
- `supabase/functions/refund-store-order/index.ts` (line 3)
- `supabase/functions/send-paid-message/index.ts` (line 2)

This unblocks QA reset and likely fixes the AI generator since broken deployments cascade.

### 2. Fix mobile menu displacing navbar header

**Root cause**: The mobile menu (line 400-651) renders inline inside the `<nav>`, pushing content down. It uses `relative` positioning with `bg-background` but sits inside the nav flow.

**Fix**: Change the mobile nav container at line 401 to `position: fixed` with `inset-x-0` and `top: calc(4rem + env(safe-area-inset-top))`, so it overlays content instead of displacing the header. Add `bottom-0` and `overflow-y-auto` for full-screen scrollable overlay.

### 3. Add "Edit Profile" to desktop dropdown

**Root cause**: Desktop dropdown (lines 267-364) has no "Edit Profile" option. Only the mobile menu (line 618-627) has it.

**Fix**: Add a `DropdownMenuItem` after "Account Settings" (line 356) with `onClick={() => setIsProfileOpen(true)}`, using the `User` icon and "Edit Profile" label. Import `Edit` from lucide-react or reuse `User`.

### 4. Scroll to top on route change

**Root cause**: No global scroll-to-top on navigation. React Router preserves scroll position.

**Fix**: Create `src/components/ScrollToTopOnNavigate.tsx` using `useLocation` + `useEffect` calling `window.scrollTo(0, 0)` on `location.pathname` change. Add it inside `RouterContent` in `src/App.tsx`.

### 5. Lock body scroll when JumBot is open

**Root cause**: JumBot (line 204) is a fixed overlay but doesn't prevent background scrolling. No `overflow: hidden` is set on body.

**Fix**: Add a `useEffect` in the `JumBot` component (after line 190) that sets `document.body.style.overflow = 'hidden'` when open on mobile (`window.innerWidth < 640`), restoring on close/unmount. Same pattern as Navbar lines 55-64.

---

### Technical Details

| File | Change |
|---|---|
| 5 edge function `index.ts` files | `npm:` to `https://esm.sh/` import |
| `src/components/layout/Navbar.tsx` | Fixed-position mobile menu; Edit Profile in desktop dropdown |
| `src/components/ScrollToTopOnNavigate.tsx` | New component for scroll reset on route change |
| `src/App.tsx` | Import + render `<ScrollToTopOnNavigate />` |
| `src/components/jumbot/JumBot.tsx` | Body scroll lock when open on mobile |

### Not Touched
- Payments, credits, pricing, store, existing AI tools logic

