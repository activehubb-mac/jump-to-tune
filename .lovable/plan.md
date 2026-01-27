
# Spotify-Inspired Library UI and Interactions

## Current State Analysis

After reviewing the codebase, here's what already exists:

### ✅ Already Implemented
- **Basic Library Page** (`Collection.tsx`): Tabs for Playlists, Liked, Following
- **Playlist System**: Create, delete, edit playlists with cover mosaics
- **PlaylistCard Component**: Shows playlist with hover actions
- **PlaylistDetail Page**: Drag-and-drop reordering with @dnd-kit
- **Swipe Gesture Infrastructure**: `SwipeableNotification.tsx` uses framer-motion (portable pattern)
- **Recently Played Hook**: Stores track history in localStorage
- **Pull-to-Refresh**: Already integrated
- **Owned Track Detection**: `usePurchases` hook with `isOwned()` function
- **Sorting**: Premium feature for collection sorting

### ❌ Missing for Spotify-Style Experience
- Horizontal filter chips (unified filter bar)
- Real-time search across library items
- Recently Played carousel on Library page
- Mobile swipe-to-delete for playlists/tracks
- Owned tracks visual highlighting (glowing ring, "OWNED" badge)
- Direct playback on owned track click (without navigation)
- Folder-based navigation for playlists

---

## Implementation Plan

### Phase 1: Library Filter Chips & Search Bar
**Goal**: Replace tabs with Spotify-style horizontal filter chips and add real-time search

**New Component**: `src/components/library/LibraryFilterBar.tsx`

```text
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Search...]                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [All] [Playlists] [Owned] [Liked] [Artists] [Albums]           │
│  ↑ active chip has filled background                            │
└─────────────────────────────────────────────────────────────────┘
```

**Changes to `Collection.tsx`**:
- Replace `Tabs` component with horizontal scrollable filter chips
- Add debounced search input that filters across all content types
- Use `useMemo` to filter items based on active chip + search query

---

### Phase 2: Recently Played Carousel
**Goal**: Show a horizontal carousel of recently played tracks at the top of the Library

**New Component**: `src/components/library/RecentlyPlayedCarousel.tsx`

- Uses existing `useRecentlyPlayed` hook
- Horizontal scroll with momentum scrolling (ios-scroll class)
- Compact track cards with cover art, title, artist
- Click to play directly (no navigation)
- Shows "No recent plays" message when empty

**Layout Position**:
```text
┌────────────────────────────────────────────────────┐
│ My Library                                         │
├────────────────────────────────────────────────────┤
│ Recently Played  ────────────────────────── See All│
│ [Track 1] [Track 2] [Track 3] [Track 4] ...  ──>   │
├────────────────────────────────────────────────────┤
│ [Filter Chips]                                     │
│ [Content Grid]                                     │
└────────────────────────────────────────────────────┘
```

---

### Phase 3: Owned Tracks Visual Highlighting
**Goal**: Make owned tracks visually distinct with glowing ring and badge

**Styling for Owned Tracks**:
- **Glowing Ring**: `ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-[0_0_15px_rgba(var(--primary),0.3)]`
- **OWNED Badge**: Pulsing badge in top-left corner
- **Playing State**: Badge text changes to "Playing" with different color when active

**CSS Addition to `index.css`**:
```css
.owned-track-ring {
  @apply ring-2 ring-primary/50 ring-offset-2 ring-offset-background;
  box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.25);
}

.owned-badge {
  @apply animate-pulse bg-primary/90 text-primary-foreground;
}

.owned-badge-playing {
  @apply bg-accent text-accent-foreground animate-none;
}
```

**Components to Update**:
- Track cards in Library grid
- Recently Played carousel items
- Liked tracks grid

---

### Phase 4: Direct Playback on Owned Tracks
**Goal**: Clicking an owned track plays immediately instead of navigating

**Logic Change**:
```typescript
const handleTrackClick = (track) => {
  if (isOwned(track.id)) {
    // Trigger haptic feedback
    Haptics.impact({ style: ImpactStyle.Medium });
    
    // Play directly
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      // ...
    });
  } else {
    // Navigate to browse/detail page
    navigate(`/browse?track=${track.id}`);
  }
};
```

**Components to Update**:
- Library owned tracks grid
- Recently Played carousel
- Liked tracks (if owned)

---

### Phase 5: Mobile Swipe-to-Delete Gestures
**Goal**: Allow swiping left to delete playlists and tracks on mobile

**New Component**: `src/components/library/SwipeableLibraryItem.tsx`

Based on existing `SwipeableNotification.tsx` pattern:
- Uses `framer-motion` for drag gestures
- Threshold of 100px to trigger delete
- Red destructive background revealed on swipe
- Confirmation animation before delete
- Desktop fallback: hover delete button

**Usage**:
```tsx
<SwipeableLibraryItem
  onDelete={() => deletePlaylist(playlist.id)}
  enabled={isMobile}
>
  <PlaylistCard playlist={playlist} />
</SwipeableLibraryItem>
```

---

### Phase 6: Folder-Based Playlist Organization
**Goal**: Allow users to organize playlists into folders

**Database** (already exists):
- `playlist_folders` table with `id`, `name`, `user_id`, `icon`, `color`
- `playlists.folder_id` foreign key

**New Hook**: `src/hooks/usePlaylistFolders.ts`
```typescript
export function usePlaylistFolders() {
  // Fetch folders for current user
  // Create folder
  // Delete folder
  // Move playlist to folder
}
```

**UI Changes to Library**:
- Show folders as collapsible sections
- Folder header with icon, name, playlist count
- "Create Folder" button
- Drag playlist onto folder to move
- "Unfiled" section for playlists without folder

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/library/LibraryFilterBar.tsx` | Horizontal filter chips + search |
| `src/components/library/RecentlyPlayedCarousel.tsx` | Recently played horizontal scroll |
| `src/components/library/SwipeableLibraryItem.tsx` | Swipe-to-delete wrapper |
| `src/components/library/OwnedTrackCard.tsx` | Track card with glowing ring styling |
| `src/components/library/FolderSection.tsx` | Collapsible folder with playlists |
| `src/hooks/usePlaylistFolders.ts` | Folder management hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Collection.tsx` | Major refactor: replace tabs with filter bar, add carousel, integrate all new components |
| `src/index.css` | Add `.owned-track-ring`, `.owned-badge`, `.owned-badge-playing` classes |
| `src/hooks/usePlaylists.ts` | Add `moveToFolder` mutation |
| `src/components/playlist/PlaylistCard.tsx` | Add optional owned-style highlighting |

---

## Spotify-Style Visual Design

### Color Palette (from existing theme)
- **Background**: `#0A0A0A` (pure black)
- **Cards**: `#121212` (dark grey)
- **Primary**: Blue-purple gradient (from JumTunes logo)
- **Accent**: Cyan highlight

### Filter Chips Styling
```css
/* Inactive chip */
.filter-chip {
  @apply px-4 py-2 rounded-full text-sm font-medium 
         bg-muted/30 text-muted-foreground 
         hover:bg-muted/50 transition-all;
}

/* Active chip */
.filter-chip-active {
  @apply bg-primary text-primary-foreground 
         shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)];
}
```

### Library Grid Layout
```text
Mobile: 2 columns
Tablet: 3 columns
Desktop: 4-5 columns
```

---

## Implementation Order

1. **Phase 1**: Filter chips & search (foundation)
2. **Phase 2**: Recently Played carousel (quick win, uses existing hook)
3. **Phase 3**: Owned track highlighting (CSS + component updates)
4. **Phase 4**: Direct playback logic (behavior change)
5. **Phase 5**: Swipe-to-delete (mobile UX)
6. **Phase 6**: Folder organization (most complex, requires UI for folder management)

---

## Technical Considerations

### Performance
- Use `useMemo` for filtered content to avoid re-renders
- Debounce search input (300ms)
- Virtualize long lists if >100 items

### Mobile Experience
- Ensure 44x44px touch targets
- Use `touch-manipulation` for immediate response
- Apply `ios-scroll` class to horizontal carousels

### Haptic Feedback Integration
- Play track: `ImpactStyle.Medium`
- Delete action: `NotificationType.Warning`
- Folder open/close: `ImpactStyle.Light`

### State Synchronization
- Use React Query cache invalidation for folder/playlist updates
- Optimistic updates for like/unlike actions
