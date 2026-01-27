
# Fix Sidebar/Mobile Menu Opacity Plan

## Problem

The mobile navigation menu uses the `glass` utility class which has a semi-transparent background (`bg-card/80` = 80% opacity). This causes the content behind the menu to show through, creating visual confusion as seen in the screenshot.

---

## Solution

Make the mobile menu background fully opaque so it completely covers the content below, while keeping the desktop navbar with its subtle glass effect.

---

## Changes

### File: `src/index.css`

Update the glass utility to be fully opaque:

```css
/* Before */
.glass {
  @apply bg-card/80;
}

/* After */
.glass {
  @apply bg-card;
}
```

This change makes the glass class use 100% opaque card background instead of 80%.

### Alternative: Mobile-Only Fix

If you want to keep the desktop navbar semi-transparent but make mobile fully opaque:

**File: `src/components/layout/Navbar.tsx`**

Add a specific solid background class to the mobile navigation container:

```tsx
{/* Before */}
<div 
  className="md:hidden py-4 overflow-y-auto overscroll-contain touch-pan-y"
  ...
>

{/* After */}
<div 
  className="md:hidden py-4 overflow-y-auto overscroll-contain touch-pan-y bg-card"
  ...
>
```

And update the main nav wrapper to have a solid background on mobile:

```tsx
{/* Before */}
<nav className="fixed top-0 left-0 right-0 z-50 glass" ...>

{/* After - solid on mobile, glass on desktop */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-card md:bg-card/80" ...>
```

---

## Recommended Approach

**Option 1 (Simplest)**: Make `glass` class fully opaque everywhere - cleaner look that matches the smoke-gray theme direction.

**Option 2 (Targeted)**: Keep desktop glass effect but override mobile to be solid - more complexity but preserves desktop aesthetic.

---

## Visual Result

```text
BEFORE:
┌─────────────────────┐
│ Menu (transparent)  │  ← Content bleeding through
│ ▒▒▒ Home ▒▒▒▒▒▒▒▒▒ │
│ ▒▒▒ Browse ▒▒▒▒▒▒▒ │
│ (confusing visuals) │
└─────────────────────┘

AFTER:
┌─────────────────────┐
│ Menu (solid card)   │  ← Clean, no bleed-through
│     Home            │
│     Browse          │
│ (clear separation)  │
└─────────────────────┘
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Update `.glass` to use solid `bg-card` instead of `bg-card/80` |

OR (alternative approach):

| File | Change |
|------|--------|
| `src/components/layout/Navbar.tsx` | Add `bg-card` override for mobile menu container |

---

## Technical Note

The `/80` suffix in Tailwind represents 80% opacity. Removing it makes the background 100% opaque, providing a solid visual barrier between the menu and the content below.
