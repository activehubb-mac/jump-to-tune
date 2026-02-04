
# Genre System Update Roadmap

## Overview
You've provided a comprehensive genre taxonomy with 27 main genres and detailed sub-genres. This plan outlines all the locations where genres need to be updated and a recommended approach for implementation.

---

## Files Requiring Genre Updates

### 1. Track Upload Page (`src/pages/Upload.tsx`)
**Current State:** 20 hardcoded genres (Electronic, Hip Hop, Pop, etc.)
**Location:** Lines 42-63
**Purpose:** Genre selection dropdown when artists/labels upload single tracks

### 2. Track Edit Page (`src/pages/TrackEdit.tsx`)
**Current State:** Same 20 hardcoded genres
**Location:** Lines 26-47
**Purpose:** Genre selection dropdown when editing existing tracks

### 3. Album Upload Page (`src/pages/AlbumUpload.tsx`)
**Current State:** 14 hardcoded genres
**Location:** Lines 39-43
**Purpose:** Genre selection dropdown when uploading albums/EPs

### 4. Browse Filter Bar (`src/components/browse/BrowseFilterBar.tsx`)
**Current State:** Only 9 genres shown as filter pills
**Location:** Line 7
**Purpose:** Genre filtering on the Browse page

### 5. Onboarding Page (`src/pages/Onboarding.tsx`)
**Current State:** 12 genres for artist/label profile setup
**Location:** Lines 16-19 (`GENRE_OPTIONS`)
**Purpose:** Artists select up to 5 genres during profile setup

---

## Recommended Implementation Approach

### Phase 1: Create Centralized Genre Configuration
Create a single source of truth for all genres and sub-genres:

**New File:** `src/lib/genres.ts`

```text
Structure:
+----------------------------------+
|  Main Genres (27)                |
|  - Hip-Hop / Rap                 |
|  - R&B / Soul                    |
|  - Pop                           |
|  - Afrobeats                     |
|  - Dancehall                     |
|  - Reggae                        |
|  - Latin                         |
|  - Electronic                    |
|  - House                         |
|  - Techno                        |
|  - EDM                           |
|  - Rock                          |
|  - Alternative                   |
|  - Indie                         |
|  - Jazz                          |
|  - Blues                         |
|  - Gospel                        |
|  - Christian                     |
|  - Country                       |
|  - Folk                          |
|  - Classical                     |
|  - Soundtracks / Scores          |
|  - Instrumental                  |
|  - Beats                         |
|  - Lo-Fi                         |
|  - World Music                   |
|  - Experimental                  |
+----------------------------------+
|  Sub-Genres (grouped by parent)  |
|  - Hip-Hop: Boom Bap, Trap, etc. |
|  - R&B: Neo-Soul, Funk, etc.     |
|  - Electronic: Deep House, etc.  |
|  - Rock: Punk, Metal, etc.       |
|  - World: Amapiano, K-Pop, etc.  |
+----------------------------------+
```

### Phase 2: Update Upload Pages
- **Upload.tsx**: Replace `GENRES` constant with import from centralized file
- **TrackEdit.tsx**: Replace `GENRES` constant with import
- **AlbumUpload.tsx**: Replace `GENRES` constant with import
- Add optional sub-genre dropdown that appears when a main genre is selected

### Phase 3: Update Browse Filtering
- **BrowseFilterBar.tsx**: Update to show popular/main genres as quick filter pills
- Add expandable sub-genre filters when a main genre is selected
- Keep the horizontal scroll for mobile-friendly browsing

### Phase 4: Update Onboarding
- **Onboarding.tsx**: Update `GENRE_OPTIONS` to use the new main genres
- Artists can still select up to 5 genres that define their sound

### Phase 5: Database Considerations
- The `tracks.genre` column stores a single genre string
- The `profile_genres` table stores multiple genres per profile
- No schema changes needed - genres are stored as text

---

## Technical Details

### Centralized Genre File Structure
```
src/lib/genres.ts

Exports:
- MAIN_GENRES: string[] (27 main genres)
- SUB_GENRES: Record<string, string[]> (sub-genres by parent)
- ALL_GENRES: string[] (flat list of all genres including sub-genres)
- getSubGenres(mainGenre: string): string[] (helper function)
- BROWSE_QUICK_GENRES: string[] (subset for browse filter pills)
- ONBOARDING_GENRES: string[] (subset for onboarding selection)
```

### Updates Per File
| File | Current Genres | Action |
|------|----------------|--------|
| `Upload.tsx` | 20 | Import `MAIN_GENRES` + optional sub-genre select |
| `TrackEdit.tsx` | 20 | Import `MAIN_GENRES` + optional sub-genre select |
| `AlbumUpload.tsx` | 14 | Import `MAIN_GENRES` |
| `BrowseFilterBar.tsx` | 9 | Import `BROWSE_QUICK_GENRES` or show categorized dropdown |
| `Onboarding.tsx` | 12 | Import `ONBOARDING_GENRES` (can be subset or all 27) |

### Backward Compatibility
- Existing tracks with old genre values will still display correctly
- The search/filter will match against the stored genre text

---

## Implementation Order

1. Create `src/lib/genres.ts` with all genre data
2. Update `src/pages/Upload.tsx` to use new genres
3. Update `src/pages/TrackEdit.tsx` to use new genres
4. Update `src/pages/AlbumUpload.tsx` to use new genres
5. Update `src/components/browse/BrowseFilterBar.tsx` for filtering
6. Update `src/pages/Onboarding.tsx` for artist profile setup
7. Test all upload, edit, browse, and onboarding flows

---

## Questions to Consider

1. **Sub-genres on upload**: Should artists be able to select both a main genre AND a sub-genre, or just pick from the full list?
2. **Browse filtering**: Should all 27+ genres show as pills, or use a dropdown with grouped categories?
3. **Onboarding limit**: Keep the 5-genre limit for artist profiles, or adjust?
