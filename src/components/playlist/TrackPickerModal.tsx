import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Disc3, ListMusic, Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnedTracks } from "@/hooks/useCollectionStats";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TrackPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  playlistName: string;
  existingTrackIds?: string[];
}

export function TrackPickerModal({
  open,
  onOpenChange,
  playlistId,
  playlistName,
  existingTrackIds = [],
}: TrackPickerModalProps) {
  const { user } = useAuth();
  const { data: ownedTracks, isLoading } = useOwnedTracks(user?.id);
  const { showFeedback } = useFeedbackSafe();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Filter tracks based on search and exclude already added ones
  const availableTracks = useMemo(() => {
    if (!ownedTracks) return [];
    
    return ownedTracks
      .filter((purchase) => {
        if (!purchase.track) return false;
        // Exclude already added tracks
        if (existingTrackIds.includes(purchase.track.id)) return false;
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const title = purchase.track.title.toLowerCase();
          const artist = purchase.track.artist?.display_name?.toLowerCase() || "";
          return title.includes(query) || artist.includes(query);
        }
        return true;
      });
  }, [ownedTracks, existingTrackIds, searchQuery]);

  const handleToggleTrack = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTrackIds.length === availableTracks.length) {
      setSelectedTrackIds([]);
    } else {
      setSelectedTrackIds(availableTracks.map((p) => p.track!.id));
    }
  };

  const handleAddTracks = async () => {
    if (selectedTrackIds.length === 0) return;
    setIsAdding(true);

    try {
      // Get current max position
      const { data: existingTracksData } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      let nextPosition = existingTracksData && existingTracksData.length > 0 
        ? existingTracksData[0].position + 1 
        : 0;

      // Insert all selected tracks
      const insertData = selectedTrackIds.map((trackId, index) => ({
        playlist_id: playlistId,
        track_id: trackId,
        position: nextPosition + index,
      }));

      const { error } = await supabase
        .from("playlist_tracks")
        .insert(insertData);

      if (error) throw error;

      // Invalidate queries - use same keys as usePlaylists hooks
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });

      showFeedback({
        type: "success",
        title: "Tracks added",
        message: `Added ${selectedTrackIds.length} track${selectedTrackIds.length === 1 ? "" : "s"} to "${playlistName}"`,
      });

      setSelectedTrackIds([]);
      onOpenChange(false);
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to add tracks to playlist",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Add Tracks to "{playlistName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your owned tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all */}
          {availableTracks.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={handleSelectAll}
                className="text-primary hover:underline"
              >
                {selectedTrackIds.length === availableTracks.length
                  ? "Deselect all"
                  : `Select all (${availableTracks.length})`}
              </button>
              {selectedTrackIds.length > 0 && (
                <span className="text-muted-foreground">
                  {selectedTrackIds.length} selected
                </span>
              )}
            </div>
          )}

          {/* Track list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : availableTracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListMusic className="w-12 h-12 mx-auto mb-2 opacity-50" />
              {ownedTracks && ownedTracks.length === 0 ? (
                <>
                  <p>No owned tracks yet</p>
                  <p className="text-sm">Purchase tracks to add them to playlists</p>
                </>
              ) : searchQuery ? (
                <>
                  <p>No matching tracks</p>
                  <p className="text-sm">Try a different search term</p>
                </>
              ) : (
                <>
                  <p>All tracks already added</p>
                  <p className="text-sm">All your owned tracks are in this playlist</p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-1">
                {availableTracks.map((purchase) => {
                  const track = purchase.track!;
                  const isSelected = selectedTrackIds.includes(track.id);

                  return (
                    <label
                      key={track.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleTrack(track.id)}
                      />
                      
                      {/* Cover */}
                      <div className="w-10 h-10 rounded bg-muted/50 flex-shrink-0 overflow-hidden">
                        {track.cover_art_url ? (
                          <img
                            src={track.cover_art_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artist?.display_name || "Unknown Artist"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTracks}
            disabled={selectedTrackIds.length === 0 || isAdding}
            className="gradient-accent"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Add {selectedTrackIds.length > 0 ? selectedTrackIds.length : ""} Track{selectedTrackIds.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
