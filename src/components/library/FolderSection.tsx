import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Folder, MoreHorizontal, Trash2, Edit, ListMusic } from "lucide-react";
import { usePlaylistFolders, PlaylistFolder } from "@/hooks/usePlaylistFolders";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { cn } from "@/lib/utils";

interface FolderSectionProps {
  onPlaylistClick?: (playlistId: string) => void;
}

export function FolderSection({ onPlaylistClick }: FolderSectionProps) {
  const { folders, deleteFolder, isLoading } = usePlaylistFolders();
  const { playlists } = usePlaylists();
  const navigate = useNavigate();
  const { showFeedback } = useFeedbackSafe();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<PlaylistFolder | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDeleteFolder = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFolder.mutateAsync(deleteTarget.id);
      showFeedback({
        type: "success",
        title: "Folder deleted",
        message: `"${deleteTarget.name}" has been removed`,
      });
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to delete folder",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading || folders.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-1 mb-4">
        {folders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderPlaylists = playlists.filter(p => p.folder_id === folder.id);

          return (
            <div key={folder.id}>
              {/* Folder header */}
              <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                  <Folder 
                    className="w-5 h-5" 
                    style={{ color: folder.color }}
                  />
                  <span className="font-medium truncate flex-1">
                    {folder.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {folderPlaylists.length}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDeleteTarget(folder)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Folder contents */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 pl-4 border-l border-border/50 space-y-1 py-1">
                      {folderPlaylists.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No playlists in this folder
                        </p>
                      ) : (
                        folderPlaylists.map((playlist) => (
                          <button
                            key={playlist.id}
                            onClick={() => {
                              if (onPlaylistClick) {
                                onPlaylistClick(playlist.id);
                              } else {
                                navigate(`/playlist/${playlist.id}`);
                              }
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded bg-muted/50 flex-shrink-0 overflow-hidden">
                              {playlist.cover_tracks?.[0]?.cover_art_url ? (
                                <img
                                  src={playlist.cover_tracks[0].cover_art_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ListMusic className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{playlist.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {playlist.track_count} tracks
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{deleteTarget?.name}" but keep all playlists inside it.
              They will be moved out of the folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
