
# Fix Queue Bottom Sheet Scrolling

## Problem
When scrolling the queue track list in the music player, the background/parent page scrolls instead of the queue content. This happens because:

1. The `ScrollArea` uses `max-h-80` which doesn't provide a fixed height for Radix to calculate overflow
2. Touch and wheel events propagate to the parent container

## Solution
Wrap the `ScrollArea` in a fixed-height container with scroll event containment to prevent event bubbling.

## Implementation

### File: `src/components/audio/GlobalAudioPlayer.tsx`

**Change at line 447:**

Replace:
```tsx
<ScrollArea className="max-h-80 ios-scroll">
```

With:
```tsx
<div 
  className="h-80"
  onTouchMove={(e) => e.stopPropagation()}
  onWheel={(e) => e.stopPropagation()}
>
  <ScrollArea className="h-full">
```

And add the closing `</div>` after `</ScrollArea>` at line 552.

---

## Why This Works

| Current Issue | Fix Applied |
|--------------|-------------|
| `max-h-80` doesn't create a scrollable boundary | `h-80` on wrapper gives fixed 320px height |
| Touch events bubble to parent | `onTouchMove={(e) => e.stopPropagation()}` stops propagation |
| Wheel events bubble to parent | `onWheel={(e) => e.stopPropagation()}` stops propagation |
| `ScrollArea` doesn't know its height | `h-full` inherits the fixed height from wrapper |

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/components/audio/GlobalAudioPlayer.tsx` | 447-552 | Wrap `ScrollArea` in fixed-height div with event containment |
