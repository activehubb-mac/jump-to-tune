
# Sub-Genre Selection and Browse Dropdown Implementation

## Overview
Based on your feedback, this plan adds sub-genre selection to upload pages and converts the Browse page genre filter from pills to a dropdown to better accommodate all 27 genres.

---

## Changes Summary

### 1. Upload Pages - Add Sub-Genre Dropdown
**Files:** `Upload.tsx`, `TrackEdit.tsx`, `AlbumUpload.tsx`

When an artist selects a main genre (e.g., "Hip-Hop / Rap"), a second dropdown will appear showing the relevant sub-genres (Boom Bap, Trap, Drill, etc.). The sub-genre is optional but helps with more precise categorization.

**UI Flow:**
```text
┌─────────────────────────────────────────┐
│ Genre                                   │
│ ┌─────────────────────────────────────┐ │
│ │ Hip-Hop / Rap                     ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Sub-Genre (optional)                    │
│ ┌─────────────────────────────────────┐ │
│ │ Select a sub-genre                ▼ │ │
│ └─────────────────────────────────────┘ │
│   • Boom Bap                            │
│   • Trap                                │
│   • Drill                               │
│   • Conscious Rap                       │
│   • etc...                              │
└─────────────────────────────────────────┘
```

**Note:** Sub-genres only appear for main genres that have them defined (Hip-Hop, R&B, Electronic, Rock, World Music, Instrumental). Other genres like Pop, Afrobeats, Jazz won't show a sub-genre dropdown.

### 2. Browse Filter Bar - Genre Dropdown
**File:** `BrowseFilterBar.tsx`

Replace the horizontally scrolling genre pills with a dropdown that shows all 27 main genres in a cleaner, more organized way.

**Current:** 11 genres as horizontal scrollable pills
**New:** Dropdown showing "All" + all 27 main genres

```text
┌──────────────────────────────────────────────────────┐
│ Search...                          │ Sort: Newest ▼ │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Genre: ┌─────────────────────┐                       │
│        │ All Genres        ▼ │   Mood: [pills...]   │
│        └─────────────────────┘                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 3. Onboarding - Already Correct
The onboarding page already uses `ONBOARDING_GENRES` which equals all 27 main genres. No changes needed here.

---

## Technical Details

### Database Storage
The `tracks.genre` column will store either:
- Just the main genre: `"Hip-Hop / Rap"`  
- Or main + sub-genre combined: `"Hip-Hop / Rap - Trap"`

This format ensures backward compatibility with existing tracks and allows filtering by either main genre or specific sub-genre.

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/genres.ts` | Add `hasSubGenres()` helper function |
| `src/pages/Upload.tsx` | Add sub-genre state and conditional dropdown |
| `src/pages/TrackEdit.tsx` | Add sub-genre state and conditional dropdown, parse existing genre on load |
| `src/pages/AlbumUpload.tsx` | Add sub-genre state and conditional dropdown |
| `src/components/browse/BrowseFilterBar.tsx` | Replace genre pills with dropdown using all `MAIN_GENRES` |

### Implementation Steps
1. Update `genres.ts` with helper to check if a genre has sub-genres
2. Update Upload page with sub-genre dropdown that appears conditionally
3. Update TrackEdit page with same logic, including parsing stored genre on load
4. Update AlbumUpload page with same logic
5. Replace BrowseFilterBar genre pills with a clean dropdown

