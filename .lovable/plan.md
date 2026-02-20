

# Fix: Artist Store Link Missing from Mobile Menu

## Problem

The "My Store" link only appears in the desktop profile dropdown menu. It is completely absent from the mobile slide-out navigation menu, so artists on mobile devices cannot find or access their store.

## Solution

Add the "My Store" link to the mobile menu, right after the "Upload Music" link -- matching the same `role === "artist"` condition used in the desktop dropdown.

## Technical Change

**File: `src/components/layout/Navbar.tsx`** (around line 540, after the Upload Music link block)

Add a new conditional link block:

```tsx
{role === "artist" && (
  <Link
    to="/artist/store"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
  >
    <Store className="w-5 h-5" />
    My Store
  </Link>
)}
```

This mirrors the existing desktop dropdown entry (line 304-310) and uses the same `Store` icon already imported in the file. No other files need changes.

