import { ArrowDownUp, Check, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LibrarySortOption } from "@/hooks/useLibraryItems";
import { cn } from "@/lib/utils";

interface LibrarySortMenuProps {
  sort: LibrarySortOption;
  onSortChange: (sort: LibrarySortOption) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
}

const SORT_OPTIONS: { value: LibrarySortOption; label: string }[] = [
  { value: "recents", label: "Recents" },
  { value: "recently-added", label: "Recently Added" },
  { value: "alphabetical", label: "Alphabetical" },
];

export function LibrarySortMenu({ sort, onSortChange, viewMode, onViewModeChange }: LibrarySortMenuProps) {
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || "Recents";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowDownUp className="w-3.5 h-3.5 mr-1.5" />
            {currentSortLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 bg-background border-border">
          {SORT_OPTIONS.map(({ value, label }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => onSortChange(value)}
              className="flex items-center justify-between"
            >
              {label}
              {sort === value && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onViewModeChange(viewMode === "list" ? "grid" : "list")}
      >
        {viewMode === "list" ? (
          <Grid className="w-4 h-4 text-muted-foreground" />
        ) : (
          <List className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
