

## Simplify JumTunes for Launch

UI-only changes to reduce overwhelm. No backend, Stripe, credit, or AI system modifications.

---

### 1. Simplified Homepage for Logged-In Artists/Labels

**File**: `src/pages/Index.tsx`

Replace the current artist/label homepage sections (DiscoverSection, CreateWithAISection, FanZoneSection, AIDJSection, MusicGalaxy CTA, KaraokePromoBanner) with three clean action cards when user is artist or label:

- **Upload Song** → `/upload` (Upload icon, primary CTA)
- **My Music** → `/artist/dashboard` or `/label/dashboard` (Music icon)
- **Grow My Music** → `/ai-tools` (Sparkles icon)

Keep the FeaturedHeroCarousel and hero text. Remove all other sections for authenticated artists/labels. Fan and guest views remain unchanged.

---

### 2. AI Tools Hub — Rename & Simplify

**File**: `src/pages/AIToolsHub.tsx`

- Change page title from "AI Tools" to "Grow My Music"
- Remove hover-state tier breakdowns (the `pricingTiers` expand-on-hover feature)
- Show only the credit cost badge per tool (e.g. "40 credits"), not "From X credits" with tier details
- Keep all existing tools and links — just reduce visual noise

---

### 3. Credit Display Simplification

**File**: `src/pages/AIToolsHub.tsx`

- Remove the `≈ $X.XX` dollar conversion line under credits
- Keep only: `{credits} credits` + "Buy Credits" button

---

### 4. Auto-Reload — Hide Until Needed

**File**: `src/pages/Wallet.tsx`

- Don't show `AutoReloadPanel` by default
- Show it only when credits < 100, with a subtle prompt: "Running low? Turn on auto-refill to never run out"
- Keep the full panel functionality once expanded

---

### 5. Navbar Simplification for Artists

**File**: `src/components/layout/Navbar.tsx`

- Rename "Create" nav link label to "Grow My Music" (keeps `/ai-tools` href)
- Remove "Video Studio" as a separate top-level nav item (it's accessible inside AI Tools Hub)

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Show 3 action cards for artists/labels instead of multiple sections |
| `src/pages/AIToolsHub.tsx` | Rename to "Grow My Music", remove tier breakdowns and dollar display |
| `src/pages/Wallet.tsx` | Conditionally show AutoReloadPanel only when credits < 100 |
| `src/components/layout/Navbar.tsx` | Rename "Create" → "Grow My Music", remove Video Studio nav entry |

### Not Touched
- Onboarding flow (already has avatar/bio/genres/subscription steps)
- Stripe/checkout/webhook logic
- Credit deduction or pricing systems
- AI tool pages or edge functions
- Fan purchase flow
- Artist store or payout systems

