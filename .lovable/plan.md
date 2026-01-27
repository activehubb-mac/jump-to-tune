
# Fix Queue Scrolling and Navbar Mobile Menu Issues

## Issues Identified

### Issue 1: Queue Panel Scrolling
**Problem**: When scrolling on the queue track list in the GlobalAudioPlayer, the background/parent scrolls instead of the queue content.

**Root Cause**: The `ScrollArea` component at line 447 has `className="max-h-80 ios-scroll"` but the Radix ScrollArea's Viewport doesn't have `overflow-y: auto` explicitly set, and the `max-h-80` may not be sufficient to trigger proper overflow behavior. Additionally, touch events might be propagating to the parent.

**Solution**: 
- Add `h-80` explicitly to give the ScrollArea a fixed height
- Add `overscroll-behavior: contain` to prevent scroll chaining to parent
- Ensure the ScrollArea has proper overflow styling

### Issue 2: Mobile Navbar Not Scrolling When Unauthenticated
**Problem**: When a user is not signed in, the mobile navigation menu doesn't scroll properly.

**Root Cause**: Looking at lines 593-601, when the user is NOT authenticated, the mobile menu shows:
- Navigation links
- A small section with Sign In and Get Started buttons

The container has `overflow-y-auto` but when unauthenticated, the content is much shorter (only 6 nav links + 2 buttons), so it might not need scrolling. However, the issue could be that the parent's `overflow: hidden` (set on body at line 56) is blocking scroll in some edge cases, or the container height calculation is incorrect.

**Solution**:
- Ensure the mobile menu container has proper touch scrolling even for shorter content
- Add explicit `overflow-y-auto` and touch scrolling properties
- Ensure the content has minimum padding at the bottom to prevent clipping

---

## Implementation Plan

### Step 1: Fix Queue Panel Scrolling in GlobalAudioPlayer.tsx
**File**: `src/components/audio/GlobalAudioPlayer.tsx`

Change line 447 from:
```tsx
<ScrollArea className="max-h-80 ios-scroll">
```

To:
```tsx
<ScrollArea className="h-80 overscroll-contain">
```

Additionally, wrap the queue content in a div with proper touch handling to prevent event propagation:
```tsx
<div 
  className="h-80" 
  onTouchMove={(e) => e.stopPropagation()}
  onWheel={(e) => e.stopPropagation()}
>
  <ScrollArea className="h-full">
    {/* queue content */}
  </ScrollArea>
</div>
```

### Step 2: Fix Mobile Navbar Scrolling for Unauthenticated Users
**File**: `src/components/layout/Navbar.tsx`

The mobile navigation container (lines 374-605) needs:

1. Ensure the ScrollArea or scrollable container properly handles the unauthenticated state
2. Add `overscroll-contain` to prevent scroll chaining
3. Ensure minimum bottom padding for safe-area and to prevent content from being cut off

Change lines 374-379 to wrap content in a proper ScrollArea:
```tsx
{isOpen && (
  <div 
    className="md:hidden fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 bg-background/95 backdrop-blur-xl z-40"
  >
    <ScrollArea className="h-full">
      <div 
        className="flex flex-col gap-2 py-4 px-4"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* navigation content */}
      </div>
    </ScrollArea>
  </div>
)}
```

---

## Technical Details

### ScrollArea Fix Details
The issue with Radix UI ScrollArea is that:
1. It needs an explicit height (not just max-height) to calculate overflow
2. Touch events need to be contained to prevent bubbling to parent scrollable elements
3. Adding `overscroll-contain` CSS prevents scroll chaining

### Mobile Navbar Fix Details
The current implementation uses:
- `overflow-y-auto` with inline styles
- `WebkitOverflowScrolling: 'touch'`

For unauthenticated users, the content is shorter but should still be in a proper scrollable container for consistency. Converting to use ScrollArea component ensures consistent behavior across authenticated and unauthenticated states.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/audio/GlobalAudioPlayer.tsx` | Fix queue ScrollArea height and add scroll containment |
| `src/components/layout/Navbar.tsx` | Restructure mobile menu to use proper scrollable container for all auth states |

---

## Testing
After implementation:
1. Test queue scrolling with 5+ tracks in queue
2. Verify parent page doesn't scroll when scrolling queue
3. Test mobile navbar when signed out
4. Test mobile navbar when signed in (ensure no regression)
5. Test on iOS Safari specifically (most prone to scroll issues)
