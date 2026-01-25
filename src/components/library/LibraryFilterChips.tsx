import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LibraryFilterOption } from "@/hooks/useLibraryItems";
import { Sparkles } from "lucide-react";

interface LibraryFilterChipsProps {
  activeFilter: LibraryFilterOption;
  onFilterChange: (filter: LibraryFilterOption) => void;
}

const FILTERS: { value: LibraryFilterOption; label: string; isSpecial?: boolean }[] = [
  { value: "playlists", label: "Playlists" },
  { value: "albums", label: "Albums" },
  { value: "artists", label: "Artists" },
  { value: "downloaded", label: "Owned", isSpecial: true },
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
      {FILTERS.map(({ value, label, isSpecial }) => (
        <Button
          key={value}
          variant={activeFilter === value ? "default" : "secondary"}
          size="sm"
          onClick={() => onFilterChange(activeFilter === value ? "all" : value)}
          className={cn(
            "h-8 px-4 rounded-full text-xs font-medium shrink-0 transition-all",
            activeFilter === value
              ? isSpecial 
                ? "bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                : "bg-primary text-primary-foreground"
              : isSpecial
                ? "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                : "bg-muted/50 hover:bg-muted/80 text-foreground"
          )}
        >
          {isSpecial && <Sparkles className="w-3 h-3 mr-1.5" />}
          {label}
        </Button>
      ))}
    </div>
  );
}
