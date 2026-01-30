

# Make Section Header Icons Smaller (Except Trending)

## Current State

The section header icons next to titles use `w-8 h-8` (32px):

| Section | Icon | Current Size |
|---------|------|--------------|
| Discover Artists | Sparkles | `w-8 h-8` (32px) |
| Recently Played | History | `w-8 h-8` (32px) |
| New Releases | Clock | `w-8 h-8` (32px) |
| Trending Now | TrendingUp | `w-8 h-8` (32px) - **KEEP AS IS** |
| Featured Artists | Star | `w-5 h-5` (20px) - Already small |

## Target Size

Based on your reference screenshots, reduce icons to `w-5 h-5` (20px) for a cleaner, more proportional look that matches the Silent Studio aesthetic.

## Changes Required

### File: src/pages/Index.tsx

| Line | Section | Change |
|------|---------|--------|
| ~973 | Discover Artists | `w-8 h-8` to `w-5 h-5` |
| ~1034 | Recently Played | `w-8 h-8` to `w-5 h-5` |
| ~1187 | New Releases | `w-8 h-8` to `w-5 h-5` |

### File: src/components/home/TrendingCarousel.tsx

| Line | State | Action |
|------|-------|--------|
| ~52 | Loading state | **Keep** `w-8 h-8` |
| ~68 | Empty state | **Keep** `w-8 h-8` |
| ~100 | Normal state | **Keep** `w-8 h-8` |

## Visual Comparison

```text
BEFORE (w-8 h-8 = 32px):
┌────────┐
│ ★★★★★  │  Recently Played
│ ★★★★★  │
└────────┘  <- Icon feels oversized

AFTER (w-5 h-5 = 20px):
┌────┐
│ ★★ │  Recently Played
│ ★★ │
└────┘  <- Icon proportional to text
```

## Summary

- Reduce section header icons from 32px to 20px
- Keep Trending Now icons at 32px (as requested)
- Featured sections already use smaller icons

