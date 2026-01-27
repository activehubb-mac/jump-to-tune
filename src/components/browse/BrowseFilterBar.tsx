import { Search, Mic2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const genres = ["All", "Electronic", "Hip Hop", "R&B", "Pop", "Rock", "Jazz", "Classical", "Indie"];
const moods = ["All", "Chill", "Energetic", "Dark", "Uplifting", "Melancholic", "Romantic", "Aggressive", "Dreamy", "Funky"];

type SortOption = "newest" | "oldest" | "popular" | "price_low" | "price_high";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "popular", label: "Most Popular" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

interface BrowseFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedMood: string;
  onMoodChange: (mood: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  karaokeOnly: boolean;
  onKaraokeChange: (enabled: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function BrowseFilterBar({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedMood,
  onMoodChange,
  sortBy,
  onSortChange,
  karaokeOnly,
  onKaraokeChange,
  hasActiveFilters,
  onClearFilters,
}: BrowseFilterBarProps) {
  return (
    <div className="bg-card border border-border shadow-sm rounded-xl p-4 md:p-6 mb-8">
      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search tracks, artists, labels, albums..."
            className="pl-10 bg-background border-border focus:border-primary h-11"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background border-border h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Genre Pills */}
      <div className="mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-3">Genre</span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2 -mx-1 px-1">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => onGenreChange(genre)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedGenre === genre
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-3" />

      {/* Mood Pills & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-3">Mood</span>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2 -mx-1 px-1">
            {/* Karaoke Toggle */}
            <button
              onClick={() => onKaraokeChange(!karaokeOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                karaokeOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Mic2 className="w-4 h-4" />
              <span>Sing-along</span>
            </button>

            {moods.map((mood) => (
              <button
                key={mood}
                onClick={() => onMoodChange(mood)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  selectedMood === mood
                    ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-1 ring-offset-background"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters & Clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedGenre !== "All" && (
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                  {selectedGenre}
                </span>
              )}
              {selectedMood !== "All" && (
                <span className="px-2 py-1 rounded-md bg-accent/50 text-accent-foreground text-xs">
                  {selectedMood}
                </span>
              )}
              {karaokeOnly && (
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs flex items-center gap-1">
                  <Mic2 className="w-3 h-3" />
                  Sing-along
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground h-7 px-2"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
