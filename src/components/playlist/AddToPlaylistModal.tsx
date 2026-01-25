import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Check, ListMusic } from "lucide-react";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AddToPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  onCreateNew?: () => void;
}

export function AddToPlaylistModal({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  onCreateNew,
}: AddToPlaylistModalProps) {
  const { playlists, isLoading } = usePlaylists();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const { showFeedback } = useFeedbackSafe();
  const { lightTap, success } = useHapticFeedback();
  const queryClient = useQueryClient();

  // Check which playlists already contain this track
  const playlistsWithTrack = playlists.filter((p) =>
    p.cover_tracks?.some((t) => t.id === trackId)
  );

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    lightTap();
    setAddingTo(playlistId);
    try {
      // Get the current max position
      const { data: existingTracks } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existingTracks && existingTracks.length > 0 
        ? existingTracks[0].position + 1 
        : 0;

      // Insert the track
      const { error } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: nextPosition,
        });

      if (error) {
        if (error.code === "23505") {
          showFeedback({
            type: "info",
            title: "Already in playlist",
            message: `"${trackTitle}" is already in "${playlistName}"`,
          });
        } else {
          throw error;
        }
      } else {
        // Invalidate queries to refresh data - use same keys as usePlaylists hooks
        queryClient.invalidateQueries({ queryKey: ["playlists"] });
        queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });
        
        success();
        showFeedback({
          type: "success",
          title: "Added to playlist",
          message: `"${trackTitle}" added to "${playlistName}"`,
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to add track to playlist",
      });
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Add to Playlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new playlist button */}
          {onCreateNew && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-dashed"
              onClick={() => {
                onOpenChange(false);
                onCreateNew();
              }}
            >
              <Plus className="w-4 h-4" />
              Create New Playlist
            </Button>
          )}

          {/* Playlist list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListMusic className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No playlists yet</p>
              <p className="text-sm">Create your first playlist to get started</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {playlists.map((playlist) => {
                  const isInPlaylist = playlistsWithTrack.some((p) => p.id === playlist.id);
                  const isAdding = addingTo === playlist.id;

                  return (
                    <button
                      key={playlist.id}
                      onClick={() => !isInPlaylist && handleAddToPlaylist(playlist.id, playlist.name)}
                      disabled={isInPlaylist || isAdding}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      {/* Mini cover */}
                      <div className="w-12 h-12 rounded bg-muted/50 flex-shrink-0 overflow-hidden">
                        {playlist.cover_tracks && playlist.cover_tracks[0]?.cover_art_url ? (
                          <img
                            src={playlist.cover_tracks[0].cover_art_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ListMusic className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{playlist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {playlist.track_count} {playlist.track_count === 1 ? "track" : "tracks"}
                        </p>
                      </div>

                      {/* Status */}
                      {isAdding ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : isInPlaylist ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
