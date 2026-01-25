import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LibraryFilterOption } from "@/hooks/useLibraryItems";

interface LibraryFilterChipsProps {
  activeFilter: LibraryFilterOption;
  onFilterChange: (filter: LibraryFilterOption) => void;
}

const FILTERS: { value: LibraryFilterOption; label: string }[] = [
  { value: "playlists", label: "Playlists" },
  { value: "albums", label: "Albums" },
  { value: "artists", label: "Artists" },
  { value: "downloaded", label: "Downloaded" },
];

export function LibraryFilterChips({ activeFilter, onFilterChange }: LibraryFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {activeFilter !== "all" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange("all")}
          className="h-8 px-3 rounded-full text-xs font-medium shrink-0 bg-muted/30 hover:bg-muted/50"
        >
          ✕
        </Button>
      )}
      {FILTERS.map(({ value, label }) => (
        <Button
          key={value}
          variant={activeFilter === value ? "default" : "secondary"}
          size="sm"
          onClick={() => onFilterChange(activeFilter === value ? "all" : value)}
          className={cn(
            "h-8 px-4 rounded-full text-xs font-medium shrink-0 transition-all",
            activeFilter === value
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 hover:bg-muted/80 text-foreground"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
