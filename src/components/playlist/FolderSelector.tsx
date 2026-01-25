import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Folder, FolderPlus, Check, X } from "lucide-react";
import { usePlaylistFolders, PlaylistFolder } from "@/hooks/usePlaylistFolders";
import { CreateFolderModal } from "./CreateFolderModal";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface FolderSelectorProps {
  playlistId: string;
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
}

export function FolderSelector({
  playlistId,
  currentFolderId,
  onFolderChange,
}: FolderSelectorProps) {
  const { folders, createFolder, movePlaylistToFolder } = usePlaylistFolders();
  const { showFeedback } = useFeedbackSafe();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currentFolder = folders.find(f => f.id === currentFolderId);

  const handleMoveToFolder = async (folderId: string | null) => {
    try {
      await movePlaylistToFolder.mutateAsync({ playlistId, folderId });
      onFolderChange(folderId);
      showFeedback({
        type: "success",
        title: folderId ? "Moved to folder" : "Removed from folder",
        message: folderId 
          ? `Playlist moved to "${folders.find(f => f.id === folderId)?.name}"`
          : "Playlist removed from folder",
      });
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to move playlist",
      });
    }
  };

  const handleCreateFolder = async (data: { name: string; color: string }) => {
    try {
      const folder = await createFolder.mutateAsync(data);
      await handleMoveToFolder(folder.id);
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to create folder",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Folder 
              className="w-4 h-4" 
              style={{ color: currentFolder?.color || undefined }}
            />
            {currentFolder ? currentFolder.name : "Add to folder"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {/* Create new folder */}
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </DropdownMenuItem>
          
          {folders.length > 0 && <DropdownMenuSeparator />}
          
          {/* Remove from folder option */}
          {currentFolderId && (
            <>
              <DropdownMenuItem onClick={() => handleMoveToFolder(null)}>
                <X className="w-4 h-4 mr-2" />
                Remove from folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Folder list */}
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => handleMoveToFolder(folder.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" style={{ color: folder.color }} />
                <span className="truncate">{folder.name}</span>
              </div>
              {currentFolderId === folder.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateFolderModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateFolder}
      />
    </>
  );
}
