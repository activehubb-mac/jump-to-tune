import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LibraryFilter = "all" | "playlists" | "owned" | "liked" | "artists" | "albums";

interface LibraryFilterBarProps {
  activeFilter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreatePlaylist?: () => void;
  showSearch?: boolean;
  counts?: {
    playlists?: number;
    owned?: number;
    liked?: number;
    artists?: number;
    albums?: number;
  };
}

const filters: { value: LibraryFilter; label: string }[] = [
  { value: "playlists", label: "Playlists" },
  { value: "albums", label: "Albums" },
  { value: "artists", label: "Artists" },
  { value: "owned", label: "Downloaded" },
];

export function LibraryFilterBar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onCreatePlaylist,
  showSearch = false,
  counts = {},
}: LibraryFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(showSearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync external changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  return (
    <div className="space-y-3">
      {/* Search Bar - Only show when toggled */}
      {isSearchOpen && (
        <div className="relative animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your library..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 pr-10 bg-muted/30 border-none focus:ring-1 focus:ring-primary/50"
            autoFocus
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex items-center gap-2">
        {/* Filter/Sort Icon */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full flex-shrink-0",
            activeFilter !== "all" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onFilterChange(activeFilter === "all" ? "playlists" : "all")}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide ios-scroll flex-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;
            
            return (
              <button
                key={filter.value}
                onClick={() => onFilterChange(isActive ? "all" : filter.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                  "touch-manipulation select-none",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-foreground hover:bg-muted/60"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Search Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Create Playlist */}
        {onCreatePlaylist && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onCreatePlaylist}
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
