
# Smoke-Gray Light Theme Migration Plan

## Overview
This plan migrates JumTunes from the current dark purple/blue cyberpunk theme to a clean, modern smoke-gray light theme. The change only affects CSS variables and utility classes - no functionality will be altered.

---

## New Theme Color Palette

Based on your specifications, here's the complete color mapping:

| Token | Current (Dark) | New (Smoke Gray) | Purpose |
|-------|---------------|------------------|---------|
| Background | `260 30% 6%` (near-black) | `0 0% 95%` (#F2F2F2) | Main page background |
| Card | `260 25% 10%` (dark purple) | `0 0% 90%` (#E6E6E6) | Card backgrounds |
| Foreground | `210 40% 98%` (white) | `0 0% 10%` (#1A1A1A) | Primary text |
| Muted | `260 20% 15%` | `0 0% 85%` (#DADADA) | Muted backgrounds |
| Muted Foreground | `215 20% 65%` | `0 0% 45%` | Secondary text |
| Border | `260 20% 18%` | `0 0% 85%` (#DADADA) | Dividers/borders |
| Popover | `260 25% 10%` | `0 0% 100%` (#FFFFFF) | Modals/dropdowns |

### Accent Colors (Preserved for Brand Identity)
| Token | Value | Purpose |
|-------|-------|---------|
| Primary | `270 70% 50%` (Purple) | Buttons, links, active states |
| Secondary | `217 91% 60%` (Blue) | Secondary actions |
| Accent | `330 85% 60%` (Pink) | Highlights, CTAs |
| Destructive | `0 84% 60%` (Red) | Error states |

---

## Files to Modify

### Phase 1: Core Theme Variables
**File: `src/index.css`**

Update the `:root` CSS variables to use light theme values:

```css
:root {
  /* iOS Safe Area Insets - unchanged */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);

  /* Light Theme: Smoke Gray Base */
  --background: 0 0% 95%;           /* #F2F2F2 */
  --foreground: 0 0% 10%;           /* #1A1A1A */

  --card: 0 0% 90%;                 /* #E6E6E6 */
  --card-foreground: 0 0% 10%;      /* #1A1A1A */

  --popover: 0 0% 100%;             /* #FFFFFF */
  --popover-foreground: 0 0% 10%;   /* #1A1A1A */

  /* Brand Colors - Keep existing */
  --primary: 270 70% 50%;
  --primary-foreground: 0 0% 100%;  /* White text on purple */

  --secondary: 217 91% 60%;
  --secondary-foreground: 0 0% 100%;

  --muted: 0 0% 85%;                /* #DADADA */
  --muted-foreground: 0 0% 45%;     /* Medium gray */

  --accent: 330 85% 60%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --border: 0 0% 85%;               /* #DADADA */
  --input: 0 0% 90%;                /* Slightly darker for inputs */
  --ring: 270 70% 50%;              /* Purple focus ring */

  --radius: 0.75rem;

  /* Updated JumTunes tokens for light theme */
  --neon-glow: 270 70% 50%;         /* Use primary for glow */
  --electric-blue: 217 91% 60%;
  --deep-purple: 270 70% 45%;
  --glass: 0 0% 92%;                /* Light glass effect */
  --glass-border: 0 0% 80%;         /* Visible border on light */

  /* Sidebar - Light theme */
  --sidebar-background: 0 0% 92%;
  --sidebar-foreground: 0 0% 10%;
  --sidebar-primary: 270 70% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 0 0% 88%;
  --sidebar-accent-foreground: 0 0% 10%;
  --sidebar-border: 0 0% 85%;
  --sidebar-ring: 270 70% 50%;
}
```

---

### Phase 2: Update Utility Classes

**File: `src/index.css`**

Update custom utilities to work with light theme:

```css
@layer utilities {
  .glass {
    @apply bg-card/80;
  }

  .glass-card {
    @apply bg-card rounded-xl shadow-sm;
  }

  .glass-card-bordered {
    @apply bg-card border border-border rounded-xl shadow-sm;
  }

  /* Softer glow for light theme */
  .neon-glow {
    box-shadow: 0 4px 14px hsl(var(--primary) / 0.25),
                0 2px 6px hsl(var(--primary) / 0.15);
  }

  .neon-glow-subtle {
    box-shadow: 0 2px 8px hsl(var(--primary) / 0.15);
  }

  /* Gradients - adjusted for light backgrounds */
  .gradient-primary {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--electric-blue)));
  }

  .gradient-accent {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  }

  /* Text gradients - keep vibrant */
  .text-gradient {
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
  }
}
```

---

### Phase 3: Remove Dark Mode Duplicate

**File: `src/index.css`**

Since we're going full light theme, either:
- **Option A**: Remove the `.dark` class entirely (single theme)
- **Option B**: Keep `.dark` class with original dark values for future toggle

I recommend **Option A** (remove dark mode) for simplicity and consistency.

---

### Phase 4: Create Theme Backup

**File: `src/themes/smoke-gray-theme.css`** (new file)

Create a backup of the new theme for reference and potential future theme switching.

---

### Phase 5: Update Tailwind Config (Optional)

**File: `tailwind.config.ts`**

Consider removing `darkMode: ["class"]` if we're committing to light-only:

```ts
export default {
  // darkMode: ["class"],  // Remove or comment out
  content: [...],
  // rest unchanged
}
```

---

## Visual Impact Summary

| Component | Before | After |
|-----------|--------|-------|
| Page Background | Near-black | Light smoke gray (#F2F2F2) |
| Cards | Dark purple | Light gray (#E6E6E6) |
| Text | White | Near-black (#1A1A1A) |
| Modals/Popovers | Dark | Pure white (#FFFFFF) |
| Buttons (Primary) | Purple on dark | Purple on light |
| Glows | Neon pink shadows | Subtle purple shadows |
| Borders | Dark purple | Light gray (#DADADA) |

---

## What Stays the Same

- All functionality and layouts
- Button variants and component structure
- Navigation and routing
- Audio player logic
- All page structures and grids
- Primary/accent brand colors (purple/pink/blue)

---

## Implementation Steps

1. **Backup current theme** to `src/themes/default-theme.css` (already exists)
2. **Update `:root` variables** in `src/index.css` with smoke-gray values
3. **Remove `.dark` class** or update with inverted values
4. **Update utility classes** (`.glass`, `.neon-glow`) for light aesthetics
5. **Create new theme backup** in `src/themes/smoke-gray-theme.css`
6. **Test across all pages** to verify readability and contrast

---

## Accessibility Considerations

- **Contrast ratios** will improve with dark text on light backgrounds
- **Primary buttons** maintain good contrast (purple on gray)
- **Muted text** (#737373) provides adequate contrast on #F2F2F2 (4.5:1 ratio)
- **Focus rings** remain visible with purple color

---

## Files Modified Summary

| File | Change |
|------|--------|
| `src/index.css` | Update all CSS variables to light theme values |
| `src/themes/smoke-gray-theme.css` | Create new file with theme backup |
| `tailwind.config.ts` | Optional: Remove darkMode config |

This is a CSS-only change with no impact on functionality, data, or audio playback.
