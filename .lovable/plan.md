

## Add Cinematic Tier to Motion Upgrade System

### Current State
- "Animate — 80 credits" button exists at line 431-433, but it just navigates to Video Studio without any credit deduction or confirmation
- `LiveAvatarPreview` uses basic CSS animations (ken-burns, breathe, glow)
- Pricing config in `aiPricing.ts` already has the tiers defined (basic: 0, performance: 80, cinematic: 200)
- No actual credit deduction happens for motion upgrades — the button just routes to Video Studio

### Changes

#### 1. `src/components/ai/LiveAvatarPreview.tsx` — Add tier-based visual differentiation

Add a `tier` prop (`"basic" | "performance" | "cinematic"`):
- **basic** (default): current animations
- **performance**: slightly slower, stronger glow
- **cinematic**: slowest ken-burns (10s), enhanced glow with dual-color pulse, subtle 3D perspective tilt via CSS `perspective` + `rotateY`, deeper vignette, badge says "Cinematic Avatar"

#### 2. `src/pages/AIIdentityBuilder.tsx` — Add Cinematic button + credit deduction flow

Add state: `motionTier` (tracks current tier), `motionConfirmOpen`, `pendingMotionTier`

**New buttons** (replace current single Animate button):
```
Animate — 80 credits    (Performance)
Cinematic — 200 credits
```

**On click**: open `CreditConfirmModal` with the appropriate cost (80 or 200).

**On confirm**:
- Call `supabase.rpc("deduct_ai_credits", { p_user_id, p_credits })` directly
- If success: update `motionTier` state, update saved identity settings if `savedId` exists, show success toast
- If fail (insufficient): show error toast
- Pass `motionTier` to `<LiveAvatarPreview tier={motionTier} />`

**"Use in Video" and navigate**: pass `motion_level` param alongside existing params

#### 3. `src/pages/AIVideoStudio.tsx` — Read `motion_level` param

Read `motion_level` from URL params. If "cinematic", pre-select HD tier (400 credits) and show "Cinematic Identity loaded" banner.

### Files

| File | Change |
|---|---|
| `src/components/ai/LiveAvatarPreview.tsx` | Add `tier` prop with visual differentiation per tier |
| `src/pages/AIIdentityBuilder.tsx` | Add Cinematic button, credit deduction on confirm, motion tier state |
| `src/pages/AIVideoStudio.tsx` | Read `motion_level` param, auto-select HD for cinematic |

### Not Touched
- Cover Art Generator — untouched
- Edge functions — no changes needed (credit deduction uses existing `deduct_ai_credits` RPC)
- `aiPricing.ts` — already has correct tiers

