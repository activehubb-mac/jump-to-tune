

# Mobile-Only Compact Sizing for Homepage Sections

## Problem
The Featured Artists, Featured Labels, Featured Tracks boxes, hero carousel, brand statement, and role CTA cards are too large on mobile. Desktop should remain unchanged.

## Approach
Use mobile-first classes that compact on small screens and restore full sizing at `md:` breakpoint. All changes are purely CSS class adjustments — no structural changes.

## Changes

### 1. `src/pages/Index.tsx`

**FeaturedArtistsSection (lines 77-168)**
- Section padding: `py-6 md:py-14` (was `py-10 md:py-14`)
- Card padding: `p-4 md:p-10` (was `p-6 md:p-10`)
- Avatar: `w-20 h-20 md:w-36 md:h-36` (was `w-28 h-28 md:w-36`)
- Heading: `text-xl md:text-3xl` (was `text-2xl md:text-3xl`)
- Gap between avatar and info: `gap-4 md:gap-10` (was `gap-6 md:gap-10`)
- Section header margin: `mb-4 md:mb-6`

**FeaturedLabelsSection (lines 241-370)**
- Same padding/avatar/heading reductions as Artists
- Hide label stats (tracks/artists/followers) on mobile: add `hidden md:flex` to the stats container (line 303)

**FeaturedTracksSection (lines 406-508)**
- Same padding reductions
- Cover art: `w-24 h-24 md:w-40 md:h-40` (was `w-32 h-32 md:w-40`)
- Heading: `text-xl md:text-3xl` (was `text-2xl md:text-3xl`)

**Brand Statement (lines 997-1010)**
- Padding: `p-5 md:p-12` (was `p-8 md:p-12`)
- Heading: `text-2xl md:text-4xl` (was `text-3xl md:text-4xl`)
- Text: `text-base md:text-lg` (was `text-lg`)

**Role CTA Cards (lines 1021-1063)**
- Card padding: `p-5 md:p-8` (was `p-8`)
- Icon container: `w-12 h-12 md:w-16 md:h-16` (was `w-16 h-16`)
- Inner icons: `w-6 h-6 md:w-8 md:h-8` (was `w-8 h-8`)
- Heading: `text-xl md:text-2xl` (was `text-2xl`)
- Margin below icon: `mb-4 md:mb-6` (was `mb-6`)

**Discover Artists section (line 833)**
- Section padding: `py-6 md:py-14`
- Heading: `text-2xl md:text-3xl`

**Recently Played / New Releases sections**
- Section padding: `py-6 md:py-14`
- Heading: `text-2xl md:text-3xl`

### 2. `src/components/home/FeaturedHeroCarousel.tsx`
- Aspect ratio: `aspect-[16/10] md:aspect-video` (was `aspect-[4/3] md:aspect-video`)
- Cover thumbnail: `w-16 h-16 md:w-28 md:h-28` (was `w-20 h-20 md:w-28`)
- Title: `text-lg md:text-3xl` (was `text-xl md:text-3xl`)
- Padding: `px-3 py-4 md:p-8` (was `px-4 py-6 md:p-8`)

### Files Modified
| File | Scope |
|------|-------|
| `src/pages/Index.tsx` | Mobile-only class reductions across all homepage sections |
| `src/components/home/FeaturedHeroCarousel.tsx` | Mobile-only aspect ratio and thumbnail size reduction |

Desktop appearance remains completely unchanged — all reductions use the base (mobile) class with `md:` restoring the original desktop values.

