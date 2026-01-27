

# Plan: Improve Trending Now Section Layout

## The Problem
The current Trending Now carousel has cramped cards with navigation arrows positioned far apart on the sides, making the layout feel cluttered and different from other sections like "Recently Played".

## Solution Overview
Redesign the Trending Now section to use a more spacious horizontal scrollable layout (like RecentlyPlayedCarousel) with stacked navigation arrows grouped together in the header area for a cleaner look.

## Design Approach

```text
┌──────────────────────────────────────────────────────────────┐
│  ↗ Trending Now              [←] [→] [View All]              │
│  The hottest tracks on JumTunes right now                    │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │         │ │         │ │         │ │         │ │         │ │
│  │  Cover  │ │  Cover  │ │  Cover  │ │  Cover  │ │  Cover  │ │
│  │         │ │         │ │         │ │         │ │         │ │
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ │
│  │ Title   │ │ Title   │ │ Title   │ │ Title   │ │ Title   │ │
│  │ Artist  │ │ Artist  │ │ Artist  │ │ Artist  │ │ Artist  │ │
│  │ $0.10   │ │ $0.10   │ │ $0.10   │ │ $0.10   │ │ $0.10   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                                            (scrollable →→→)  │
└──────────────────────────────────────────────────────────────┘
```

## Changes Required

### File: `src/components/home/TrendingCarousel.tsx`

**1. Update the header layout** (lines 94-105)
- Move navigation arrows into the header alongside the "View All" button
- Group arrows together horizontally (stacked side-by-side)
- Add ChevronLeft and ChevronRight icons

**2. Replace Embla Carousel with horizontal scroll container** (lines 107-218)
- Remove the Carousel, CarouselContent, CarouselItem components
- Use a native horizontal scroll container (`overflow-x-auto`) like RecentlyPlayedCarousel
- Apply smooth scrolling behavior

**3. Add scroll navigation functions**
- Create `scrollRef` to reference the scroll container
- Add `scrollLeft` and `scrollRight` functions that scroll by a fixed amount

**4. Update card sizing**
- Increase card width from responsive carousel sizing to fixed `w-44 md:w-48` for more breathing room
- Cards will be larger and less cramped

**5. Remove the outer `px-12` padding** (line 107)
- The side padding was only needed for the carousel arrows
- The horizontal scroll will use edge-to-edge scrolling with `px-4` inner padding

## Technical Details

### Imports to update
- Remove: `Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext`
- Add: `ChevronLeft, ChevronRight` (icons for header nav buttons)
- Add: `useRef` (for scroll container reference)

### Scroll behavior
```tsx
const scrollContainerRef = useRef<HTMLDivElement>(null);

const scrollLeft = () => {
  scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
};

const scrollRight = () => {
  scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
};
```

### Header with stacked arrows
```tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h2>...</h2>
    <p>...</p>
  </div>
  <div className="flex items-center gap-2">
    <button onClick={scrollLeft}>
      <ChevronLeft />
    </button>
    <button onClick={scrollRight}>
      <ChevronRight />
    </button>
    <Button asChild>
      <Link to="/browse">View All</Link>
    </Button>
  </div>
</div>
```

### Horizontal scroll container
```tsx
<div 
  ref={scrollContainerRef}
  className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
>
  {trendingTracks.map((track) => (
    <div className="flex-shrink-0 w-44 md:w-48 ...">
      {/* Card content */}
    </div>
  ))}
</div>
```

## Visual Improvements
- Cards will be larger and more readable
- Navigation arrows grouped cleanly in the header
- Horizontal scroll matches the "Recently Played" pattern for consistency
- Mobile-friendly swipe navigation preserved
- Less visual clutter with arrows removed from the sides

