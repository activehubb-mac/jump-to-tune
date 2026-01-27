import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Play,
  Pause,
  Shuffle,
  Trash2,
  GripVertical,
  Loader2,
  Disc3,
  Edit,
  Check,
  X,
  ListMusic,
  Plus,
  Music,
  Settings,
} from "lucide-react";
import { usePlaylistTracks, usePlaylists, PlaylistTrack } from "@/hooks/usePlaylists";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDuration } from "@/lib/formatters";
import { TrackPickerModal } from "@/components/playlist/TrackPickerModal";
import { PlaylistEditModal } from "@/components/playlist/PlaylistEditModal";

function SortableTrackRow({
  item,
  onPlay,
  onRemove,
  isPlaying,
  isCurrentTrack,
}: {
  item: PlaylistTrack;
  onPlay: () => void;
  onRemove: () => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.track_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group ${
        isCurrentTrack ? "bg-primary/10" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Cover */}
      <div
        className="w-12 h-12 rounded bg-muted/50 flex-shrink-0 overflow-hidden cursor-pointer relative group/cover"
        onClick={onPlay}
      >
        {item.track?.cover_art_url ? (
          <img
            src={item.track.cover_art_url}
            alt={item.track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="w-5 h-5 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
          {isCurrentTrack && isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentTrack ? "text-primary" : ""}`}>
          {item.track?.title || "Unknown Track"}
        </p>
        {item.track?.artist && (
          <Link
            to={`/artist/${item.track.artist.id}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {item.track.artist.display_name || "Unknown Artist"}
          </Link>
        )}
      </div>

      {/* Duration */}
      <span className="text-sm text-muted-foreground">
        {item.track?.duration ? formatDuration(item.track.duration) : "--:--"}
      </span>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { playTrack, currentTrack, isPlaying, clearQueue, addToQueue } = useAudioPlayer();

  const { playlists, updatePlaylist, deletePlaylist } = usePlaylists();
  const { tracks, isLoading, removeTrack, reorderTracks } = usePlaylistTracks(playlistId || null);

  const playlist = playlists.find((p) => p.id === playlistId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist?.name || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.track_id === active.id);
      const newIndex = tracks.findIndex((t) => t.track_id === over.id);
      const newOrder = arrayMove(tracks, oldIndex, newIndex);
      reorderTracks.mutate(newOrder.map((t) => t.track_id));
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    clearQueue();
    const firstTrack = tracks[0];
    if (firstTrack.track) {
      playTrack({
        id: firstTrack.track.id,
        title: firstTrack.track.title,
        audio_url: firstTrack.track.audio_url,
        cover_art_url: firstTrack.track.cover_art_url,
        duration: firstTrack.track.duration,
        artist: firstTrack.track.artist,
      });
    }
    tracks.slice(1).forEach((item) => {
      if (item.track) {
        addToQueue({
          id: item.track.id,
          title: item.track.title,
          audio_url: item.track.audio_url,
          cover_art_url: item.track.cover_art_url,
          duration: item.track.duration,
          artist: item.track.artist,
        });
      }
    });
    showFeedback({
      type: "success",
      title: "Now Playing",
      message: `Playing ${tracks.length} tracks from "${playlist?.name}"`,
    });
  };

  const handleShufflePlay = () => {
    if (tracks.length === 0) return;
    clearQueue();
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const firstTrack = shuffled[0];
    if (firstTrack.track) {
      playTrack({
        id: firstTrack.track.id,
        title: firstTrack.track.title,
        audio_url: firstTrack.track.audio_url,
        cover_art_url: firstTrack.track.cover_art_url,
        duration: firstTrack.track.duration,
        artist: firstTrack.track.artist,
      });
    }
    shuffled.slice(1).forEach((item) => {
      if (item.track) {
        addToQueue({
          id: item.track.id,
          title: item.track.title,
          audio_url: item.track.audio_url,
          cover_art_url: item.track.cover_art_url,
          duration: item.track.duration,
          artist: item.track.artist,
        });
      }
    });
    showFeedback({
      type: "success",
      title: "Shuffle Play",
      message: `Playing ${tracks.length} tracks shuffled`,
    });
  };

  const handleSaveName = async () => {
    if (!playlist || !editName.trim()) return;
    try {
      await updatePlaylist.mutateAsync({ id: playlist.id, name: editName.trim() });
      setIsEditing(false);
      showFeedback({
        type: "success",
        title: "Playlist updated",
        message: `Renamed to "${editName.trim()}"`,
      });
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to update playlist",
      });
    }
  };

  const handleSavePlaylist = async (data: { name?: string; description?: string; cover_image_url?: string | null }) => {
    if (!playlist) return;
    try {
      await updatePlaylist.mutateAsync({ id: playlist.id, ...data });
      showFeedback({
        type: "success",
        title: "Playlist updated",
        message: "Changes saved successfully",
      });
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to update playlist",
      });
      throw new Error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!playlist) return;
    try {
      await deletePlaylist.mutateAsync(playlist.id);
      showFeedback({
        type: "success",
        title: "Playlist deleted",
        message: `"${playlist.name}" has been deleted`,
      });
      navigate("/library");
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to delete playlist",
      });
    }
  };

  // Calculate total duration
  const totalDuration = tracks.reduce((sum, t) => sum + (t.track?.duration || 0), 0);

  // Generate cover mosaic
  const coverTracks = tracks.slice(0, 4);

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => {
            // Check if there's history to go back to, otherwise go to library
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/library");
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Cover */}
              <div 
                className="w-48 h-48 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0 mx-auto md:mx-0 relative group cursor-pointer"
                onClick={() => setShowEditModal(true)}
              >
                {/* Custom cover or mosaic */}
                {playlist?.cover_image_url ? (
                  <img
                    src={playlist.cover_image_url}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : coverTracks.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                ) : coverTracks.length === 1 ? (
                  <img
                    src={coverTracks[0].track?.cover_art_url || ""}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {[0, 1, 2, 3].map((i) => {
                      const track = coverTracks[i]?.track || coverTracks[i % coverTracks.length]?.track;
                      return track?.cover_art_url ? (
                        <img
                          key={i}
                          src={track.cover_art_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div key={i} className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <Disc3 className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Edit overlay */}
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-2">Playlist</p>
                
                {isEditing ? (
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs text-2xl font-bold"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveName}>
                      <Check className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <h1 className="text-3xl font-bold">{playlist?.name || "Playlist"}</h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowEditModal(true)}
                      title="Edit playlist"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Description */}
                {playlist?.description && (
                  <p className="text-muted-foreground mb-2 max-w-lg">
                    {playlist.description}
                  </p>
                )}

                <p className="text-sm text-muted-foreground mb-6">
                  {tracks.length} {tracks.length === 1 ? "track" : "tracks"} · {formatDuration(totalDuration)}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                  <Button
                    className="gradient-accent neon-glow-subtle"
                    onClick={handlePlayAll}
                    disabled={tracks.length === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShufflePlay}
                    disabled={tracks.length === 0}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTrackPicker(true)}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Add Tracks
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* Track list */}
            {tracks.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ListMusic className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">This playlist is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Add tracks from your owned collection to this playlist
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTrackPicker(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tracks
                </Button>
              </div>
            ) : (
              <div className="glass-card p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tracks.map((t) => t.track_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {tracks.map((item) => (
                        <SortableTrackRow
                          key={item.track_id}
                          item={item}
                          isCurrentTrack={currentTrack?.id === item.track_id}
                          isPlaying={isPlaying && currentTrack?.id === item.track_id}
                          onPlay={() => {
                            if (item.track) {
                              playTrack({
                                id: item.track.id,
                                title: item.track.title,
                                audio_url: item.track.audio_url,
                                cover_art_url: item.track.cover_art_url,
                                duration: item.track.duration,
                                artist: item.track.artist,
                              });
                            }
                          }}
                          onRemove={() => {
                            removeTrack.mutate({ trackId: item.track_id });
                            showFeedback({
                              type: "success",
                              title: "Track removed",
                              message: `Removed from playlist`,
                            });
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{playlist?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Track picker modal */}
      <TrackPickerModal
        open={showTrackPicker}
        onOpenChange={setShowTrackPicker}
        playlistId={playlistId || ""}
        playlistName={playlist?.name || ""}
        existingTrackIds={tracks.map((t) => t.track_id)}
      />

      {/* Edit playlist modal */}
      {playlist && (
        <PlaylistEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          playlist={{
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            cover_image_url: playlist.cover_image_url,
          }}
          onSave={handleSavePlaylist}
        />
      )}
    </Layout>
  );
}
