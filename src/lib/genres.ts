/**
 * Centralized Genre Configuration
 * Single source of truth for all genres and sub-genres across the app
 */

// Main genres (27 total)
export const MAIN_GENRES = [
  "Hip-Hop / Rap",
  "R&B / Soul",
  "Pop",
  "Afrobeats",
  "Dancehall",
  "Reggae",
  "Latin",
  "Electronic",
  "House",
  "Techno",
  "EDM",
  "Rock",
  "Alternative",
  "Indie",
  "Jazz",
  "Blues",
  "Gospel",
  "Christian",
  "Country",
  "Folk",
  "Classical",
  "Soundtracks / Scores",
  "Instrumental",
  "Beats",
  "Lo-Fi",
  "World Music",
  "Experimental",
] as const;

// Sub-genres grouped by parent genre
export const SUB_GENRES: Record<string, readonly string[]> = {
  "Hip-Hop / Rap": [
    "Boom Bap",
    "Trap",
    "Drill",
    "Conscious Rap",
    "Underground",
    "East Coast",
    "West Coast",
    "Southern Rap",
    "UK Rap",
    "Afro-Rap",
    "Latin Rap",
    "Alternative Hip-Hop",
    "Freestyle",
    "Cypher Tracks",
  ],
  "R&B / Soul": [
    "Contemporary R&B",
    "Neo-Soul",
    "Alternative R&B",
    "Classic Soul",
    "Funk",
    "Quiet Storm",
  ],
  "Electronic": [
    "Deep House",
    "Afro House",
    "Tech House",
    "Trance",
    "Dubstep",
    "Drum & Bass",
    "Garage",
    "Jungle",
    "Ambient",
    "Chillstep",
  ],
  "Rock": [
    "Indie Rock",
    "Punk",
    "Metal",
    "Hard Rock",
    "Alternative Rock",
    "Emo",
    "Grunge",
    "Progressive Rock",
  ],
  "World Music": [
    "Afro-Fusion",
    "Amapiano",
    "Highlife",
    "Soukous",
    "Bongo Flava",
    "Middle Eastern",
    "Indian / Desi",
    "K-Pop",
    "J-Pop",
    "Asian Fusion",
    "Caribbean",
    "Brazilian",
    "Afro-Latin",
  ],
  "Instrumental": [
    "Instrumental Hip-Hop",
    "Film Score",
    "Piano",
    "Guitar",
    "Orchestral",
    "Meditation",
    "Ambient Soundscapes",
  ],
} as const;

// Helper function to get sub-genres for a main genre
export function getSubGenres(mainGenre: string): readonly string[] {
  return SUB_GENRES[mainGenre] || [];
}

// All genres flattened (main + sub-genres)
export const ALL_GENRES: string[] = [
  ...MAIN_GENRES,
  ...Object.values(SUB_GENRES).flat(),
];

// Popular genres for browse filter pills (subset of main genres)
export const BROWSE_QUICK_GENRES = [
  "All",
  "Hip-Hop / Rap",
  "R&B / Soul",
  "Pop",
  "Afrobeats",
  "Electronic",
  "House",
  "Rock",
  "Jazz",
  "Lo-Fi",
  "World Music",
] as const;

// Genres for onboarding selection (all 27 main genres)
export const ONBOARDING_GENRES = [...MAIN_GENRES] as const;

// Type for main genre
export type MainGenre = (typeof MAIN_GENRES)[number];

// Type for browse quick genres
export type BrowseQuickGenre = (typeof BROWSE_QUICK_GENRES)[number];
