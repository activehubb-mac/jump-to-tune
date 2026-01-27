
# Update Price Display Colors to Charcoal

## Overview

The price displays across the app are still using the gold/accent color (which was previously purple). This needs to be changed to match the charcoal theme by using `text-primary` instead of `text-accent` for all price-related displays.

Looking at the screenshot, the "$0.10" price next to the "Play Now" button is showing in accent color and needs to be charcoal.

---

## Files Requiring Price Color Updates

### High Priority - Price Displays Using text-accent

| File | Line | Current | Change To |
|------|------|---------|-----------|
| `src/pages/Index.tsx` | ~1572 | `text-accent` | `text-primary` |
| `src/pages/LabelProfile.tsx` | ~315 | `text-accent` | `text-primary` |
| `src/pages/LabelCollectors.tsx` | ~141 | `text-accent` | `text-primary` |

### Already Correct - Using text-primary

These files are already using the correct charcoal color for prices:
- `src/components/home/TrendingCarousel.tsx` - `text-primary font-semibold`
- `src/components/dashboard/TrackCard.tsx` - `text-primary`
- `src/pages/ArtistProfile.tsx` - `text-primary`
- `src/pages/ArtistCollectors.tsx` - `text-primary`

---

## Implementation Details

### 1. Update Index.tsx Featured Tracks Section

```tsx
// Line ~1572
// Before
<div className="text-xs text-accent font-medium mt-1">

// After
<div className="text-xs text-primary font-semibold mt-1">
```

### 2. Update LabelProfile.tsx Track Prices

```tsx
// Line ~315
// Before
<span className="text-sm text-accent">{formatPrice(track.price)}</span>

// After
<span className="text-sm text-primary font-medium">{formatPrice(track.price)}</span>
```

### 3. Update LabelCollectors.tsx Total Spent

```tsx
// Line ~141
// Before
<p className="font-bold text-accent">{formatPrice(collector.total_spent)}</p>

// After
<p className="font-bold text-primary">{formatPrice(collector.total_spent)}</p>
```

---

## Additional Accent Color Review

While updating prices, I'll also review decorative accent usages. The following uses of `bg-accent` are acceptable for badges/icons (not prices):

- Karaoke badge icons (`bg-accent` for mic icon background)
- Verified label badges
- Heart icons for likes

These decorative uses can remain as accent color since they're not price-related.

---

## Summary of Changes

| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Change featured tracks section price color |
| `src/pages/LabelProfile.tsx` | Change track listing price color |
| `src/pages/LabelCollectors.tsx` | Change collector total spent color |

---

## Result

After this update, all price displays will consistently use the charcoal primary color (`text-primary`) instead of the gold/bronze accent color, matching the smoke-gray theme aesthetic shown in the reference screenshot.
