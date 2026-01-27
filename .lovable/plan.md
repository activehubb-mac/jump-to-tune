

# Plan: Redesign Browse Page - Spotify-Style Layout with Multi-Entity Search

## Overview

Transform the Browse page into an elegant, well-organized Spotify-inspired layout with improved filter placement and expanded search functionality that searches across tracks, artists, labels, albums, and EPs.

---

## Current Issues Identified

1. **Genre and Mood filters are stacked vertically** taking up significant space and feeling cluttered
2. **Search only queries tracks** - users expect to find artists, labels, and albums too
3. **Filter sections feel disconnected** from the rest of the page
4. **No visual hierarchy** between filter types and results

---

## Proposed Layout Redesign

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  FEATURED CAROUSEL (Hero)                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  Featured Albums                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│  Browse Music                                                                │
│  Discover and collect exclusive tracks from talented artists                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Search tracks, artists, labels, albums...              [Sort: ▼]   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  [All] [Electronic] [Hip Hop] [R&B] [Pop] [Rock] [Jazz] [Classical]    │ │
│  │  ──────────────────────────────────────────────────────────────────────│ │
│  │  [♪ Sing-along] [Chill] [Energetic] [Dark] [Uplifting] ... [Clear ✕]  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ SEARCH RESULTS (when searching) ─────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ARTISTS (2 results)          LABELS (1 result)                       │  │
│  │  ┌──────┐ ┌──────┐            ┌──────┐                                │  │
│  │  │ 🎤   │ │ 🎤   │            │ 🏷️   │                                │  │
│  │  └──────┘ └──────┘            └──────┘                                │  │
│  │                                                                        │  │
│  │  ALBUMS & EPs (3 results)                                             │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                                           │  │
│  │  │ 💿   │ │ 💿   │ │ 💿   │                                           │  │
│  │  └──────┘ └──────┘ └──────┘                                           │  │
│  │                                                                        │  │
│  │  TRACKS (5 results)                                                   │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │  │
│  │  │ 🎵   │ │ 🎵   │ │ 🎵   │ │ 🎵   │ │ 🎵   │                         │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ BROWSE MODE (when not searching) ────────────────────────────────────┐  │
│  │  Recently Viewed                                                       │  │
│  │  Albums & EPs                                                          │  │
│  │  Tracks (infinite scroll)                                              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### Part 1: Unified Filter Bar Component

Create a new consolidated filter bar that combines search, genres, moods, and sort in one cohesive container.

**New Component: `src/components/browse/BrowseFilterBar.tsx`**

```text
Visual Layout:
┌───────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   [Sort: ▼]     │
│  │  🔍 Search tracks, artists, labels, albums...       │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                                                                          │
│  Genre: [All] [Electronic] [Hip Hop] [R&B] [Pop] [Rock] [Jazz] ...       │
│  ────────────────────────────────────────────────────────────────────────│
│  Mood:  [♪ Sing-along] [Chill] [Energetic] [Dark] [Uplifting] [Clear ✕]  │
└───────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Search bar and Sort dropdown on the same line
- Genre pills on one row (horizontally scrollable on mobile)
- Mood pills with Sing-along toggle on second row
- Visual separator between Genre and Mood rows
- Active filter chips with "Clear" button
- Pop-out card styling (`bg-card border border-border shadow-sm`)

### Part 2: Multi-Entity Search Hook

**New Hook: `src/hooks/useBrowseSearch.ts`**

This hook will perform parallel searches across multiple entity types:

```typescript
interface BrowseSearchResults {
  tracks: Track[];
  artists: Artist[];
  labels: Label[];
  albums: Album[];
  isLoading: boolean;
}
```

**Search Logic:**
1. Debounce search query (300ms)
2. When query length >= 2 characters, fetch in parallel:
   - Tracks: Search by title using existing `useInfinitePublishedTracks`
   - Artists: Use existing `useArtists` with searchQuery
   - Labels: Use existing `useLabels` with searchQuery  
   - Albums: Query `albums` table with title ILIKE search
3. Return categorized results with loading state

### Part 3: Search Results Display Component

**New Component: `src/components/browse/SearchResultsView.tsx`**

When the user is actively searching, display results in categorized sections:

1. **Artists Section** (if results > 0)
   - Horizontal scroll row of artist cards with avatars
   - Shows: avatar, name, track count, fan count

2. **Labels Section** (if results > 0)  
   - Horizontal scroll row of label cards
   - Shows: logo, name, artist count, track count

3. **Albums & EPs Section** (if results > 0)
   - Grid layout using existing `AlbumCard` component
   - Shows: cover, title, artist, release type

4. **Tracks Section** (if results > 0)
   - Grid layout using existing track card pattern
   - Shows: cover, title, artist, price

**Empty State:**
- Show "No results found for [query]" with suggestions to try different keywords

### Part 4: Browse.tsx Updates

**Changes to `src/pages/Browse.tsx`:**

1. **Import new components:**
   - `BrowseFilterBar`
   - `SearchResultsView`
   - `useBrowseSearch`

2. **State management:**
   - Add `isSearchMode` derived from `searchQuery.length > 0`
   - Add search results state from `useBrowseSearch`

3. **Conditional rendering:**
   ```tsx
   {isSearchMode ? (
     <SearchResultsView 
       query={searchQuery}
       results={searchResults}
       isLoading={searchLoading}
     />
   ) : (
     <>
       <RecentlyViewedSection />
       <FeaturedAlbumsSection />
       <AlbumsSection />
       <TracksSection />
     </>
   )}
   ```

4. **Remove old filter sections:**
   - Remove separate Genre pills section (lines 372-390)
   - Remove separate Mood pills section (lines 392-410)
   - Remove separate search input (lines 359-370)
   - Replace with unified `<BrowseFilterBar />` component

5. **Apply pop-out card styling:**
   - Filter bar: `bg-card border border-border shadow-sm rounded-xl p-4`
   - Search result sections: `bg-card border border-border shadow-sm`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/browse/BrowseFilterBar.tsx` | Create | Unified filter bar with search, genres, moods, sort |
| `src/components/browse/SearchResultsView.tsx` | Create | Categorized search results display |
| `src/hooks/useBrowseSearch.ts` | Create | Multi-entity search hook (tracks, artists, labels, albums) |
| `src/pages/Browse.tsx` | Modify | Integrate new components, conditional search/browse mode |

---

## Responsive Behavior

**Mobile (< 768px):**
- Search bar full width, sort dropdown below
- Genre pills: horizontal scroll with momentum scrolling
- Mood pills: horizontal scroll with momentum scrolling  
- Search results: single column for artists/labels, 2-column grid for albums/tracks

**Desktop (>= 768px):**
- Search bar and sort dropdown inline
- Genre/mood pills wrap to multiple lines if needed
- Search results: horizontal scroll for artists/labels, 4-5 column grid for albums/tracks

---

## Search Placeholder Update

Current: `"Search tracks, artists, or genres..."`

New: `"Search tracks, artists, labels, albums..."`

This accurately reflects the expanded search capability.

