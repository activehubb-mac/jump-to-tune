import { useState } from "react";
import { ArrowUpDown, Grid3X3, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SortOption = "recents" | "recently-added" | "alphabetical" | "creator";
export type ViewMode = "list" | "grid";

interface LibrarySortHeaderProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const sortLabels: Record<SortOption, string> = {
  recents: "Recents",
  "recently-added": "Recently Added",
  alphabetical: "Alphabetical",
  creator: "Creator",
};

export function LibrarySortHeader({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: LibrarySortHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2">
      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowUpDown className="w-4 h-4 mr-1.5" />
            <span className="text-sm">{sortLabels[sortBy]}</span>
            <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="glass">
          {Object.entries(sortLabels).map(([value, label]) => (
            <DropdownMenuItem
              key={value}
              onClick={() => onSortChange(value as SortOption)}
              className={cn(
                sortBy === value && "text-primary bg-primary/10"
              )}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Mode Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => onViewModeChange(viewMode === "list" ? "grid" : "list")}
      >
        {viewMode === "list" ? (
          <Grid3X3 className="w-4 h-4" />
        ) : (
          <List className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
