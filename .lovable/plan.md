

## Add "Grow Today" Block to Artist Homepage

### Overview
Add a prominent "Grow Today" action block above the existing artist/label action cards on the homepage. Three buttons driving direct navigation to Video Studio, Release Builder, and Playlist Builder.

---

### Changes

**File: `src/pages/Index.tsx`**

Insert a new section **before** the existing "SIMPLIFIED ARTIST/LABEL ACTION CARDS" section (line 234), visible only to logged-in artists/labels:

```
Grow Today
Do this to grow your music today

[🎬 Create Video]  [📢 Create Promo]  [🎧 Boost Song]
```

- **Create Video** → links to `/ai-video`
- **Create Promo** → links to `/ai-release`
- **Boost Song** → links to `/ai-playlist`

Implementation details:
- Three `Link` buttons in a responsive grid (`grid-cols-3` on mobile, full width)
- Each button: icon + label, gradient/primary styling, hover scale effect
- Section has a heading ("Grow Today") and subtext ("Do this to grow your music today")
- Compact card styling using existing `glass-card-bordered` pattern
- Placed between the hero section and the Upload/My Music/Grow My Music cards

No new components needed — this is ~30 lines of JSX added inline to Index.tsx.

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Add "Grow Today" section above artist action cards |

### Not Touched
- AI tool pages, pricing, credit system, backend functions, auto-reload, navigation

