

## AI Identity Builder: Default Motion System

### Reality Check

The request asks for CSS-based "breathing/blinking" animations on generated avatars. These are **static images** — real facial animation (blinking, head movement) requires video generation models like Replicate's `minimax/video-01-live`, which costs 130+ credits and takes 2+ minutes. That contradicts "load instantly, low compute cost, no heavy credits."

**Practical approach**: Use CSS/canvas animations to create the *illusion* of a living avatar — subtle zoom, parallax drift, ambient glow pulses, and floating particle effects. This is genuinely lightweight, instant, and free. Real motion (lip-sync, head movement) belongs in the upgrade tiers that route to the Video Studio.

---

### Changes

#### 1. New Component: `src/components/ai/LiveAvatarPreview.tsx`

A reusable component that wraps any avatar image with layered CSS animations:
- Slow Ken Burns zoom-in/out loop (4s cycle via CSS keyframes)
- Subtle vertical float/breathing motion (translateY ±2px)
- Ambient glow pulse on border (opacity oscillation)
- Soft vignette overlay with slight opacity shift
- "Live Avatar Ready" badge overlay

Props: `src: string`, `className?: string`, `showBadge?: boolean`

All CSS-only — zero compute, zero API calls, instant render.

#### 2. `src/pages/AIIdentityBuilder.tsx` — Use LiveAvatarPreview

Replace the static `<img>` in the results section (line 351) with `<LiveAvatarPreview>`. Add a "Live Avatar Ready" tag automatically after generation.

Update action buttons to include:
- **Set as Artist Profile** — updates `profiles.avatar_url` with the generated image
- **Animate (Upgrade)** — routes to Video Studio with `avatar_performance` type pre-selected

Update `handleSaveIdentity` to store a `motion_enabled: true` flag in the settings JSONB.

Update `handleUseInVideo` to also pass `identity_id` (if saved) via URL params.

#### 3. `src/lib/aiPricing.ts` — Add Motion Tier Pricing

Add motion tier definitions (for display/future use):
```
identity_motion: {
  label: "Avatar Motion",
  base: 0,
  tiers: [
    { label: "Basic (CSS Preview)", credits: 0 },
    { label: "Performance Mode", credits: 80 },
    { label: "Cinematic Mode", credits: 200 },
  ],
}
```

#### 4. `src/pages/AIVideoStudio.tsx` — Accept Identity ID

Extend the existing URL param reading to also accept `identity_id`, and if present, show which saved identity is being used.

#### 5. `tailwind.config.ts` — Add Keyframes

Add `ken-burns` and `avatar-breathe` keyframes for the live preview animations.

#### 6. Database: `artist_identities` Table — No Schema Change Needed

The existing `settings` JSONB column can store `motion_enabled: true` and `motion_tier: "basic"` without migration.

---

### NOT Touched
- Cover Art Generator — completely untouched
- Edge function `ai-identity-builder` — no changes (motion is CSS-only)
- No new API calls for the default motion preview

### Files
| File | Change |
|---|---|
| `src/components/ai/LiveAvatarPreview.tsx` | **New** — CSS-animated avatar wrapper |
| `src/pages/AIIdentityBuilder.tsx` | Use LiveAvatarPreview, add Set as Profile + Animate buttons |
| `src/lib/aiPricing.ts` | Add motion tier pricing definitions |
| `src/pages/AIVideoStudio.tsx` | Accept `identity_id` param |
| `tailwind.config.ts` | Add animation keyframes |

