

# Make Card Artwork More Visible

## Problem
The artwork on both the **Create With AI** cards (5) and the **guest feature cards + CTA** (6 in Index.tsx) is barely visible due to very low opacity (`opacity-15` / `opacity-25`) combined with heavy dark gradient overlays.

## Changes

### 1. `src/components/home/CreateWithAISection.tsx`
- Increase AI-generated image opacity from `opacity-25` → `opacity-50`, hover from `opacity-35` → `opacity-65`
- Lighten the gradient overlay: change `from-background via-background/80 to-background/40` → `from-background/90 via-background/50 to-transparent`

### 2. `src/pages/Index.tsx` — Feature cards (4 cards)
- Increase image opacity from `opacity-15` → `opacity-45`, hover from `opacity-25` → `opacity-60`
- Lighten overlay: `from-background via-background/70 to-background/30` → `from-background/80 via-background/40 to-transparent`

### 3. `src/pages/Index.tsx` — Music Galaxy CTA card
- Increase image opacity from `opacity-20` → `opacity-45`
- Lighten overlay similarly

### 4. `src/pages/Index.tsx` — Bottom CTA card
- Increase image opacity from `opacity-15` → `opacity-40`
- Lighten overlay: `from-background via-background/80 to-background/50` → `from-background/80 via-background/40 to-transparent`

### Files
| File | Change |
|------|--------|
| `src/components/home/CreateWithAISection.tsx` | Boost image opacity & reduce overlay |
| `src/pages/Index.tsx` | Boost image opacity & reduce overlay on 6 cards |

