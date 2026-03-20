

## High-Conversion Credit-Transparent AI Tools System

### Overview
Overhaul the AI Tools Hub and individual tool pages with exact pricing, credit transparency, a pre-generation confirmation modal, smart nudges, and premium treatment for AI Video Studio.

### Changes

#### 1. `src/pages/AIToolsHub.tsx` — Complete Redesign

**Credit Header (Section 1)**
- Bold credit count + USD equivalent (credits / 100)
- Progress bar showing credits relative to a contextual max (e.g. 2000)
- Primary "+ Buy Credits" CTA button linking to `/wallet`

**Tool Cards (Sections 2–5, 7, 10)**
- Reorder: AI Video Studio first, then AI Viral Generator, then the rest
- Replace all vague "20-100" with fixed "Starts at X credits"
- Each card has a `pricingTiers` array; on hover, expand to show tier breakdown
- AI Video Studio card: "NEW" badge, gold glow (`shadow-[0_0_20px_hsl(45,80%,50%,0.3)]`), stronger hover elevation
- Video + Viral cards get value framing text: "Optimized for TikTok, Reels & Shorts"
- Non-hovered cards dim slightly when any card is hovered (group-hover on container)
- Smooth transitions, no layout breaking

**Pricing locked per spec:**
- AI Playlist Builder: 5 credits
- AI Release Builder: 10 credits
- AI Cover Art Generator: 10 credits
- AI Identity Builder: 15 credits
- AI Video Generator: Starts at 130 (tiers: 10s/480p=130, 15s/480p=180, 20s/480p=240, HD/720p=400)
- AI Viral Generator: Starts at 500 (tiers: 3 clips=500, 5 clips=850)

#### 2. `src/hooks/useVideoStudio.ts` — Update DURATION_OPTIONS

Replace current duration/credit tiers:
```
{ seconds: 10, credits: 130, label: "10s (480p)" }
{ seconds: 15, credits: 180, label: "15s (480p)" }
{ seconds: 20, credits: 240, label: "20s (480p)" }
{ seconds: -1, credits: 400, label: "HD (720p)" }
```

#### 3. `src/pages/AIViralGenerator.tsx` — Update DURATION_OPTIONS

Replace with clip-count-based pricing:
```
{ clips: 3, credits: 500, label: "3 Clips" }
{ clips: 5, credits: 850, label: "5 Clips" }
```

#### 4. New: `src/components/ai/CreditConfirmModal.tsx` (Section 6)

Reusable confirmation modal shown before any AI generation:
- Shows: selected options summary, exact credit cost, remaining credits after
- Example: "This will cost 180 credits. You will have 1160 credits remaining."
- Confirm (primary) + Cancel buttons
- Blocks generation until confirmed

#### 5. `src/pages/AIVideoStudio.tsx` — Integration (Sections 6, 8, 9)

- Wire CreditConfirmModal before `handleGenerate`
- Smart nudge: if credits < 400, show "You may need more credits for HD video generation"
- During generation: "Generating… credits will be deducted once complete"
- After completion toast: "Video created successfully"
- Value framing text under header

#### 6. `src/pages/AIViralGenerator.tsx` — Integration

- Wire CreditConfirmModal before generate
- Update pricing display to match new clip-based tiers

#### 7. `src/components/wallet/CreditBalanceChip.tsx` — Add USD equivalent

Show "X credits ≈ $Y.YY" format

### Files
- `src/pages/AIToolsHub.tsx` — full redesign with tiered cards + credit header
- `src/components/ai/CreditConfirmModal.tsx` — new confirmation modal
- `src/hooks/useVideoStudio.ts` — update DURATION_OPTIONS pricing
- `src/pages/AIVideoStudio.tsx` — confirm modal + nudges + generation feedback
- `src/pages/AIViralGenerator.tsx` — clip-based pricing + confirm modal
- `src/components/wallet/CreditBalanceChip.tsx` — USD equivalent display

