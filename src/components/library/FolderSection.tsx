import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, Plus, MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { Playlist } from "@/hooks/usePlaylists";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface PlaylistFolder {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface FolderSectionProps {
  folder: PlaylistFolder;
  playlists: Playlist[];
  onEditFolder?: (folder: PlaylistFolder) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeletePlaylist: (playlistId: string, playlistName: string) => void;
}

export function FolderSection({
  folder,
  playlists,
  onEditFolder,
  onDeleteFolder,
  onDeletePlaylist,
}: FolderSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    setIsOpen(!isOpen);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Folder Header */}
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <button
            onClick={handleToggle}
            className={cn(
              "flex items-center gap-2 text-left group",
              "hover:text-primary transition-colors"
            )}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ backgroundColor: folder.color || "hsl(var(--primary))" }}
            >
              <Folder className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-foreground">{folder.name}</span>
            <span className="text-sm text-muted-foreground">
              ({playlists.length})
            </span>
          </button>
        </CollapsibleTrigger>

        {/* Folder Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            {onEditFolder && (
              <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                <Edit className="w-4 h-4 mr-2" />
                Rename Folder
              </DropdownMenuItem>
            )}
            {onDeleteFolder && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteFolder(folder.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Folder
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Folder Contents */}
      <CollapsibleContent>
        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onEdit={() => {}}
                onDelete={() => onDeletePlaylist(playlist.id, playlist.name)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 text-center mb-6">
            <p className="text-muted-foreground text-sm">
              No playlists in this folder
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
