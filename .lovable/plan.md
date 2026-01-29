
# Theme Overhaul: Cosmic Dark Theme

## Overview

The founder has provided a new design direction for JumTunes with a cosmic/space-inspired dark theme. This plan outlines how to transform the current Smoke Gray light theme into the new vibrant dark theme while minimizing disruption to existing functionality.

## Current State Analysis

**Current Theme (Smoke Gray Light):**
- Background: #F2F2F2 (light gray)
- Cards: #E6E6E6 (slightly darker gray)
- Primary: Charcoal #404040
- Secondary: Olive #5F7353
- Accent: Gold/Bronze #BF9358
- Text: Dark (#1A1A1A)

**New Theme (Cosmic Dark - from founder):**
| Token | Hex | Purpose |
|-------|-----|---------|
| Primary Background | #0B0E1A | Main app background (deep space blue) |
| Secondary Gradient Start | #1A1F3B | Cards, sidebars, elevated surfaces |
| Secondary Gradient End | #3B1C5A | Gradient accents (purple tint) |
| Accent Blue Glow | #4DA6FF | Primary actions, links, highlights |
| Accent Purple Glow | #8B5CF6 | Secondary accents, featured content |
| Soft Highlight Pink | #E879F9 | Tertiary accent, notifications, badges |
| Text Primary | #F5F7FA | Main text color (light) |
| Text Secondary | #B8C0D4 | Muted text, descriptions |
| Divider/Subtle UI | #2A2F4A | Borders, separators, inputs |

## Design Strategy

### Background Image Implementation

The cosmic background image will be applied as a fixed background on the body/root element. Components will use semi-transparent cards to allow the background to show through, creating depth.

### Color Mapping

| Current Token | New Value (HSL) | Hex Equivalent |
|---------------|-----------------|----------------|
| --background | 225 40% 7% | #0B0E1A |
| --foreground | 220 20% 97% | #F5F7FA |
| --card | 225 35% 17% | ~#1A1F3B with opacity |
| --card-foreground | 220 20% 97% | #F5F7FA |
| --popover | 225 35% 17% | #1A1F3B |
| --popover-foreground | 220 20% 97% | #F5F7FA |
| --primary | 210 100% 65% | #4DA6FF (Blue Glow) |
| --primary-foreground | 220 20% 97% | #F5F7FA |
| --secondary | 263 91% 66% | #8B5CF6 (Purple Glow) |
| --secondary-foreground | 220 20% 97% | #F5F7FA |
| --accent | 292 91% 73% | #E879F9 (Pink) |
| --accent-foreground | 220 20% 97% | #F5F7FA |
| --muted | 225 30% 20% | Darker shade of card |
| --muted-foreground | 220 15% 75% | #B8C0D4 |
| --border | 225 25% 23% | #2A2F4A |
| --input | 225 25% 23% | #2A2F4A |
| --ring | 210 100% 65% | #4DA6FF |

## Files to Modify

### 1. CSS Theme Variables (Core)
**File:** `src/index.css`

Update all CSS custom properties to the new cosmic dark values. This single change propagates throughout the app due to the CSS variable architecture.

Changes:
- Update all color variables in `:root`
- Add background image styling for body
- Update glass card utilities for semi-transparency
- Add gradient utility classes for the secondary gradient
- Update neon glow effects for blue/purple theme

### 2. Background Image Asset
**Action:** Copy uploaded cosmic background to `public/images/cosmic-bg.jpg`

The background will be applied as a fixed, cover image on the body element.

### 3. Tailwind Configuration
**File:** `tailwind.config.ts`

Update custom JumTunes color tokens:
- `neon` -> Maps to pink glow
- `electric` -> Maps to blue glow
- Add new `cosmic-purple` for gradient effects

### 4. Component Hardcoded Colors
Several components have hardcoded hex values that need updating:

| File | Current Color | New Color | Purpose |
|------|--------------|-----------|---------|
| `src/components/ui/card-hover-overlay.tsx` | #1a1a1a | #0B0E1A | Hover overlay |
| `src/hooks/useConfetti.ts` | Charcoal/Olive | Blues/Purples | Celebration colors |
| `src/hooks/useStatusBar.ts` | #0d0a14 | #0B0E1A | Mobile status bar |
| `src/components/browse/HeroCarousel.tsx` | #1a1a1a | #0B0E1A | Gradient overlay |
| `src/components/home/FeaturedHeroCarousel.tsx` | #1a1a1a | #0B0E1A | Gradient overlay |
| `src/pages/UserProfile.tsx` | #404040 | #1A1F3B | Badge background |
| `src/pages/ArtistProfile.tsx` | #1a1a1a | #0B0E1A | Hover overlay |
| `src/pages/LabelProfile.tsx` | #1a1a1a | #0B0E1A | Hover overlay |
| `src/hooks/usePlaylistFolders.ts` | #404040 | #8B5CF6 | Default folder color |

### 5. Theme Backup File
**File:** `src/themes/cosmic-dark-theme.css` (new)

Create backup file documenting the new theme for reference and easy rollback.

### 6. Update Existing Backup
**File:** `src/themes/smoke-gray-theme.css`

Keep this as-is for potential rollback to light theme.

## Implementation Details

### Background Image CSS

```css
body {
  background-image: url('/images/cosmic-bg.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
}

/* Fallback solid color if image fails */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: hsl(var(--background));
  z-index: -2;
}
```

### Glass Card Updates

```css
.glass-card {
  background: hsl(225 35% 17% / 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 0.75rem;
}

.glass {
  background: hsl(225 35% 17% / 0.6);
  backdrop-filter: blur(8px);
}
```

### Gradient Utilities

```css
.gradient-primary {
  background: linear-gradient(135deg, #1A1F3B 0%, #3B1C5A 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, #4DA6FF 0%, #8B5CF6 100%);
}

.text-gradient {
  background: linear-gradient(135deg, #4DA6FF 0%, #E879F9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Neon Glow Effects

```css
.neon-glow {
  box-shadow: 
    0 0 20px hsl(210 100% 65% / 0.3),
    0 0 40px hsl(263 91% 66% / 0.2);
}

.neon-glow-subtle {
  box-shadow: 0 0 15px hsl(210 100% 65% / 0.2);
}
```

## Visual Impact Summary

| Element | Before (Light) | After (Cosmic Dark) |
|---------|----------------|---------------------|
| Background | Solid gray #F2F2F2 | Cosmic image with #0B0E1A base |
| Cards | Solid #E6E6E6 | Semi-transparent with blur |
| Navbar | Solid gray | Translucent glass effect |
| Buttons (Primary) | Charcoal solid | Blue glow with gradient |
| Text (Primary) | Dark #1A1A1A | Light #F5F7FA |
| Accents | Gold/Bronze | Pink/Purple glow |
| Borders | Gray #DADADA | Deep blue #2A2F4A |

## Scope of Changes

- **Files to modify:** ~12 files
- **Risk level:** Low - CSS variable architecture means most changes cascade automatically
- **Audio player impact:** None - styling changes only, no functional code changes
- **Testing priority:** Visual verification across all major pages

## Rollback Plan

If issues arise, the original light theme is preserved in `src/themes/smoke-gray-theme.css` and can be restored by copying those values back to `src/index.css`.
