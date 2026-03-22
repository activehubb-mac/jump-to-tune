

## Fix: Centralize All Credit Pricing — Frontend + Backend Alignment

### Problem
The centralized config (`src/lib/aiPricing.ts`) has the correct values, but several frontends and backends still use old hardcoded numbers:

| Tool | Config says | Frontend uses | Backend uses |
|---|---|---|---|
| Cover Art | 10 | 3 (first) / 1 (regen) | 3 / 1 |
| Release Builder | 10 | 10 ✓ | **5** |
| Playlist Builder | 5 | 5 ✓ | **3** |
| Identity Builder | 15/25/40 | 15/25/40 ✓ | dynamic ✓ |

### Changes

#### 1. `src/pages/CoverArtGenerator.tsx` — Fix frontend cost

Line 27: Replace `const cost = hasGenerated ? 1 : 3` with:
```typescript
import { getToolCost } from "@/lib/aiPricing";
const cost = getToolCost("cover_art"); // always 10
```
Remove the regen discount (or keep regen at reduced cost if desired — but it must match backend). Update button text to show consistent "10 credits".

Also update the backend to match:

#### 2. `supabase/functions/ai-cover-art/index.ts` — Fix backend cost

Line 38: Replace `const creditCost = is_regenerate ? 1 : 3` with `const creditCost = 10`. Flat 10 credits per generation, matching the centralized config.

#### 3. `supabase/functions/ai-release-builder/index.ts` — Fix backend cost

Line 14: Replace `const CREDIT_COST = 5` with `const CREDIT_COST = 10`.

#### 4. `supabase/functions/ai-playlist-builder/index.ts` — Fix backend cost

Line 13: Replace `const CREDIT_COST = 3` with `const CREDIT_COST = 5`.

#### 5. `src/pages/AIIdentityBuilder.tsx` — Use config instead of magic numbers

Line 75: Replace `const cost = mode === "vision" ? 15 : hdMode ? 40 : 25` with a lookup from `pricing.tiers` to stay DRY (values happen to match, but should reference the config).

#### 6. `src/pages/AIPlaylistBuilder.tsx` — Already correct (5), no change needed.

#### 7. `src/pages/AIReleaseBuilder.tsx` — Already uses `getCost("release_builder") || 10`, correct.

### Deployments Required
After editing, the 3 edge functions need redeployment:
- `ai-cover-art`
- `ai-release-builder`
- `ai-playlist-builder`

### Files
| File | Change |
|---|---|
| `src/pages/CoverArtGenerator.tsx` | Use `getToolCost("cover_art")` = 10 |
| `supabase/functions/ai-cover-art/index.ts` | `creditCost = 10` |
| `supabase/functions/ai-release-builder/index.ts` | `CREDIT_COST = 10` |
| `supabase/functions/ai-playlist-builder/index.ts` | `CREDIT_COST = 5` |
| `src/pages/AIIdentityBuilder.tsx` | Reference pricing tiers instead of magic numbers |

### NOT Touched
- Cover Art Generator logic, prompts, output — only the cost number changes
- `src/lib/aiPricing.ts` — already correct
- `src/pages/AIToolsHub.tsx` — already pulls from centralized config

