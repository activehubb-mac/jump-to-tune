import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LibraryFilter = "all" | "playlists" | "owned" | "liked" | "artists" | "albums";

interface LibraryFilterBarProps {
  activeFilter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts?: {
    playlists?: number;
    owned?: number;
    liked?: number;
    artists?: number;
    albums?: number;
  };
}

const filters: { value: LibraryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "playlists", label: "Playlists" },
  { value: "owned", label: "Owned" },
  { value: "liked", label: "Liked" },
  { value: "artists", label: "Artists" },
];

export function LibraryFilterBar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts = {},
}: LibraryFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

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

  const getCount = (filter: LibraryFilter): number | undefined => {
    switch (filter) {
      case "playlists": return counts.playlists;
      case "owned": return counts.owned;
      case "liked": return counts.liked;
      case "artists": return counts.artists;
      case "albums": return counts.albums;
      default: return undefined;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your library..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 pr-10 bg-muted/30 border-glass-border/30 focus:border-primary/50"
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

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide ios-scroll">
        {filters.map((filter) => {
          const count = getCount(filter.value);
          const isActive = activeFilter === filter.value;
          
          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                "touch-manipulation select-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {filter.label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                  isActive ? "bg-primary-foreground/20" : "bg-primary/20"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
