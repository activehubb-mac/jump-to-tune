

# Fix AI Card Artwork Generation

## Problem
The edge function works correctly when called directly (confirmed via curl test), but the client-side calls never reach it. With 11 cards (5 AI tools + 6 Fan Zone) all mounting simultaneously, the likely causes are:

1. **Simultaneous burst**: 11 `supabase.functions.invoke` calls fire at once on page load, potentially overwhelming the connection or triggering rate limits
2. **Silent failure caching**: `staleTime: Infinity` means if any query errors on first load, it stays in failed state permanently until page hard-refresh
3. **No error visibility**: Failed queries show blank cards with no feedback

## Plan

### 1. Stagger requests in `useCardArtwork.ts`
- Add a random delay (0-3s spread) before each card's first request using `queryFn` to prevent all 11 firing simultaneously
- Increase `retry` from 1 to 2 with exponential backoff
- Change `staleTime` from `Infinity` to 24 hours so failed queries can retry on next visit
- Add `retryDelay` with exponential backoff

### 2. Add sequential loading approach
- Instead of staggering randomly, use `enabled` prop with an intersection observer so cards only fetch when scrolled into view
- This naturally staggers requests since Create With AI and Fan Zone are at different scroll positions

### 3. Better fallback UI in both components
- Show a gradient placeholder instead of blank/skeleton when loading fails
- Add a "tap to generate" fallback on error state so users can manually trigger

### Implementation Details

**`src/hooks/useCardArtwork.ts`**:
- Add intersection-observer-based lazy loading: accept a `ref` or just use `enabled`
- Retry 2 times with 2s/5s delays
- `staleTime: 24h` instead of `Infinity`
- Add a small random delay in `queryFn` (0-2s) to naturally spread requests

**`src/components/home/CreateWithAISection.tsx`**:
- Wrap each `AIToolCard` in an intersection observer to only fetch when visible
- Add gradient fallback backgrounds per card that show while loading/on error

**`src/components/home/FanZoneSection.tsx`**:
- Same intersection observer approach
- Keep skeleton while loading, show gradient fallback on error instead of blank play icon

### Files Modified
| File | Change |
|------|--------|
| `src/hooks/useCardArtwork.ts` | Add staggered delay, better retry config, reduce staleTime |
| `src/components/home/CreateWithAISection.tsx` | Add intersection observer, gradient fallbacks |
| `src/components/home/FanZoneSection.tsx` | Add intersection observer, gradient fallbacks |

