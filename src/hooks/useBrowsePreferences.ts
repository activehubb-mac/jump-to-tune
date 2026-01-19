import { useState, useEffect, useCallback } from "react";

type SortOption = "newest" | "oldest" | "popular" | "price_low" | "price_high";

interface BrowsePreferences {
  genre: string;
  mood: string;
  sortBy: SortOption;
  karaokeOnly: boolean;
}

const STORAGE_KEY = "browse-preferences";

const defaultPreferences: BrowsePreferences = {
  genre: "All",
  mood: "All",
  sortBy: "newest",
  karaokeOnly: false,
};

function loadPreferences(): BrowsePreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        genre: parsed.genre || defaultPreferences.genre,
        mood: parsed.mood || defaultPreferences.mood,
        sortBy: parsed.sortBy || defaultPreferences.sortBy,
        karaokeOnly: parsed.karaokeOnly ?? defaultPreferences.karaokeOnly,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultPreferences;
}

function savePreferences(prefs: BrowsePreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function useBrowsePreferences() {
  const [preferences, setPreferencesState] = useState<BrowsePreferences>(loadPreferences);

  // Sync to localStorage whenever preferences change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const setGenre = useCallback((genre: string) => {
    setPreferencesState((prev) => ({ ...prev, genre }));
  }, []);

  const setMood = useCallback((mood: string) => {
    setPreferencesState((prev) => ({ ...prev, mood }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setPreferencesState((prev) => ({ ...prev, sortBy }));
  }, []);

  const setKaraokeOnly = useCallback((karaokeOnly: boolean) => {
    setPreferencesState((prev) => ({ ...prev, karaokeOnly }));
  }, []);

  const clearFilters = useCallback(() => {
    setPreferencesState((prev) => ({ ...prev, genre: "All", mood: "All", karaokeOnly: false }));
  }, []);

  const hasActiveFilters = preferences.genre !== "All" || preferences.mood !== "All" || preferences.karaokeOnly;

  return {
    ...preferences,
    setGenre,
    setMood,
    setSortBy,
    setKaraokeOnly,
    clearFilters,
    hasActiveFilters,
  };
}
