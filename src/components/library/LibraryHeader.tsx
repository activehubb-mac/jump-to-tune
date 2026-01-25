import { Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LibraryHeaderProps {
  title: string;
  onCreatePlaylist: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function LibraryHeader({ title, onCreatePlaylist, searchQuery, onSearchChange }: LibraryHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      {isSearchOpen ? (
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search in Your Library"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-muted/30 border-none text-sm"
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => {
              setIsSearchOpen(false);
              onSearchChange("");
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onCreatePlaylist}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
