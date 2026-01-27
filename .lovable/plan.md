
# Plan: Make All Home Page Cards Pop Out

Based on my analysis of the codebase, I've identified all the cards and sections on the home page that need the subtle "pop out" styling to match what we already applied to the Featured Artists, Featured Labels, and Karaoke Promo sections.

## Summary

Apply a consistent `bg-card border border-border shadow-sm` styling to all cards that currently blend with the background. Using `shadow-sm` instead of `shadow-md` for individual track cards to keep them subtle, while larger banner sections will use `shadow-md`.

## Changes Required

### 1. Featured Tracks Section (Index.tsx)
**Line 505** - Update the container from `bg-muted/30` to `bg-card border border-border shadow-md`

### 2. Trending Carousel Individual Cards (TrendingCarousel.tsx)
**Lines 71 and 122** - Update skeleton and actual track cards from `glass-card` to include a subtle shadow:
- Change `glass-card p-4` to `bg-card border border-border shadow-sm rounded-xl p-4`

### 3. Discover Artists Cards (Index.tsx)
**Line 988** - Update recommended artist cards from `glass-card` to:
- `bg-card border border-border shadow-sm rounded-xl p-4`

### 4. Recently Played Cards (Index.tsx)
**Line 1042** - Update recently played track cards from `glass-card` to:
- `bg-card border border-border shadow-sm rounded-xl p-4`

### 5. Features Section Cards (Index.tsx)
**Line 1126** - Update feature cards from `glass-card` to:
- `bg-card border border-border shadow-sm rounded-xl p-6`

### 6. Role CTA Cards (Index.tsx)
**Lines 1152, 1166, 1180** - Update Fan/Artist/Label signup cards from `glass-card` to:
- `bg-card border border-border shadow-sm rounded-xl p-8`

### 7. New Releases Cards (Index.tsx)
**Line 1215** - Update new release track cards from `glass-card` to:
- `bg-card border border-border shadow-sm rounded-xl p-4`

## Visual Hierarchy

| Element Type | Shadow Level | Rationale |
|-------------|-------------|-----------|
| Large banner sections (Featured Tracks) | `shadow-md` | More prominent, section-level cards |
| Individual track/artist cards | `shadow-sm` | Subtle, prevents visual overload |

## Files to Modify
- `src/pages/Index.tsx` (Featured Tracks, Discover Artists, Recently Played, Features, Role CTAs, New Releases)
- `src/components/home/TrendingCarousel.tsx` (Individual track cards)

---

## Technical Notes

The `glass-card` class uses a semi-transparent background that blends with the page background. Replacing it with `bg-card` (solid card background color: #E6E6E6) plus a border and subtle shadow will make cards visually distinct while maintaining the clean, modern aesthetic of the smoke-gray theme.
