import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Disc3, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
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
import { Link } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

interface AlbumSectionProps {
  albums: Tables<"albums">[] | undefined;
  isLoading: boolean;
  statsQueryKey: string; // e.g. "artist-stats" or "label-stats"
}

export function AlbumSection({ albums, isLoading, statsQueryKey }: AlbumSectionProps) {
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();

  const albumToDelete = albums?.find((a) => a.id === deleteAlbumId);

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumId) return;
    setIsDeleting(true);
    try {
      // First delete all tracks in the album
      const { error: tracksError } = await supabase
        .from("tracks")
        .delete()
        .eq("album_id", deleteAlbumId);

      if (tracksError) throw tracksError;

      // Then delete the album itself
      const { error: albumError } = await supabase
        .from("albums")
        .delete()
        .eq("id", deleteAlbumId);

      if (albumError) throw albumError;

      showFeedback({ type: "success", title: "Album Deleted", message: "Album and all its tracks have been deleted" });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: [statsQueryKey] });
    } catch (error) {
      console.error("Error deleting album:", error);
      showFeedback({ type: "error", title: "Delete Failed", message: "Failed to delete album" });
    } finally {
      setIsDeleting(false);
      setDeleteAlbumId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!albums || albums.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
          Albums & EPs ({albums.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album) => (
            <div key={album.id} className="glass-card overflow-hidden group relative">
              <Link to={`/album/${album.id}`} className="block">
                <div className="aspect-square bg-muted/50 relative">
                  {album.cover_art_url ? (
                    <img
                      src={album.cover_art_url}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm truncate">{album.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {album.release_type}
                    </Badge>
                    {album.is_draft && (
                      <Badge variant="outline" className="text-xs">Draft</Badge>
                    )}
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteAlbumId(album.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Album Confirmation */}
      <AlertDialog open={!!deleteAlbumId} onOpenChange={() => setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete {albumToDelete?.release_type === "ep" ? "EP" : "Album"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{albumToDelete?.title}"</strong>? This will permanently
              remove the {albumToDelete?.release_type === "ep" ? "EP" : "album"} and <strong>all tracks within it</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlbum}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
