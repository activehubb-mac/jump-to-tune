
# iOS Safe Area & Scrolling Fixes

## Current State Analysis

After thorough review, I found that **most of the Theme Updates are already fully implemented** in the codebase:
- All color variables, gradients, glass effects, neon glows are active
- The futuristic background with iOS Safari fallbacks is working

For **iOS Safe Area**, the core structure is in place (Navbar, Layout, Player bar), but there are **specific gaps causing the scrolling issue you noticed** with queue tracks.

---

## Identified Gaps

| Component | Issue | Fix |
|-----------|-------|-----|
| **Queue Panel ScrollArea** | Missing `-webkit-overflow-scrolling: touch` | Add smooth scrolling CSS |
| **Sheet Component** | No safe area padding for side/bottom variants | Add `env(safe-area-inset-*)` padding |
| **Drawer Component** | No safe area bottom padding | Add `pb-[env(safe-area-inset-bottom)]` |
| **Mobile Navigation Menu** | Missing `-webkit-overflow-scrolling: touch` | Add inline style for smooth scrolling |
| **Notifications Sheet ScrollArea** | Potentially clipped content on notch devices | Ensure max-height accounts for safe areas |

---

## Implementation Plan

### Phase 1: Global Smooth Scrolling CSS
Add a global utility class in `src/index.css` for iOS-friendly scrolling:

```css
.ios-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

---

### Phase 2: Fix Queue Panel Scrolling
**File**: `src/components/audio/GlobalAudioPlayer.tsx`

Update the queue `ScrollArea` (line 447) to include smooth scrolling:

```tsx
<ScrollArea className="max-h-80 ios-scroll">
```

Also add proper padding to prevent content from being cut off at the bottom of the queue panel.

---

### Phase 3: Fix Sheet Component
**File**: `src/components/ui/sheet.tsx`

Add safe area insets to the `sheetVariants` for each side:
- **Top sheets**: Add `padding-top: env(safe-area-inset-top)`
- **Bottom sheets**: Add `padding-bottom: env(safe-area-inset-bottom)`
- **Left/Right sheets**: Add top AND bottom padding for full coverage

Update the close button position to account for top safe area on side sheets.

---

### Phase 4: Fix Drawer Component
**File**: `src/components/ui/drawer.tsx`

Add bottom safe area padding to `DrawerContent`:

```tsx
<DrawerPrimitive.Content
  className={cn(
    "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
    className,
  )}
  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
>
```

Also add smooth scrolling to the drawer's implicit scroll container.

---

### Phase 5: Fix Mobile Navigation Menu Scrolling
**File**: `src/components/layout/Navbar.tsx`

Update the mobile menu container (line 374) to add iOS smooth scrolling:

Current:
```tsx
<div className="md:hidden py-4 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain touch-pan-y">
```

Updated:
```tsx
<div 
  className="md:hidden py-4 overflow-y-auto overscroll-contain touch-pan-y"
  style={{ 
    maxHeight: 'calc(100vh - 4rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
    WebkitOverflowScrolling: 'touch'
  }}
>
```

---

### Phase 6: Fix Notifications Sheet in Navbar
**File**: `src/components/layout/Navbar.tsx`

The notifications ScrollArea (line 440) should account for safe areas:

Current:
```tsx
<ScrollArea className="h-[calc(100vh-120px)] mt-4">
```

Updated:
```tsx
<ScrollArea 
  className="mt-4"
  style={{ 
    height: 'calc(100vh - 120px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
    WebkitOverflowScrolling: 'touch'
  }}
>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `.ios-scroll` utility class |
| `src/components/ui/scroll-area.tsx` | Add `-webkit-overflow-scrolling: touch` to viewport |
| `src/components/ui/sheet.tsx` | Add safe area padding per side variant |
| `src/components/ui/drawer.tsx` | Add bottom safe area padding |
| `src/components/layout/Navbar.tsx` | Fix mobile menu + notifications scroll height |
| `src/components/audio/GlobalAudioPlayer.tsx` | Fix queue panel scrolling |

---

## Technical Details

### Why `-webkit-overflow-scrolling: touch` Matters
This property enables iOS Safari's native momentum scrolling. Without it, scroll containers feel "sticky" and unresponsive on iOS devices.

### Safe Area Insets
These CSS environment variables (`env(safe-area-inset-*)`) dynamically adjust for:
- iPhone notch (top)
- iPhone home indicator (bottom)
- Rounded corners on newer devices

### Best Practice Pattern
For any fixed-positioned overlay or bottom sheet:
```tsx
style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
```

---

## Summary

No new features needed - just applying the existing safe area patterns consistently across all scrollable and fixed-position components. This ensures:

1. Queue tracks are scrollable on iOS
2. Sheets and drawers don't hide content behind the home indicator
3. Mobile navigation menus scroll smoothly
4. Notification panels are fully accessible on notch devices
