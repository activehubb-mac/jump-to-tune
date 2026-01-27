import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Play,
  Pause,
  Shuffle,
  Loader2,
  Disc3,
  Heart,
} from "lucide-react";
import { useLikedTracks, useLikes } from "@/hooks/useLikes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDuration } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SortOption = "recently-liked" | "alphabetical" | "artist";

interface LikedTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  audio_url: string;
  duration: number | null;
  genre: string | null;
  price: number;
  artist: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  liked_at: string;
}

function TrackRow({
  track,
  onPlay,
  onUnlike,
  isPlaying,
  isCurrentTrack,
}: {
  track: LikedTrack;
  onPlay: () => void;
  onUnlike: () => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group",
        isCurrentTrack && "bg-primary/10"
      )}
    >
      {/* Cover */}
      <div
        className="w-12 h-12 rounded bg-muted/50 flex-shrink-0 overflow-hidden cursor-pointer relative group/cover"
        onClick={onPlay}
      >
        {track.cover_art_url ? (
          <img
            src={track.cover_art_url}
            alt={track.title}
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
        <p className={cn("font-medium truncate", isCurrentTrack && "text-primary")}>
          {track.title}
        </p>
        {track.artist && (
          <Link
            to={`/artist/${track.artist.id}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {track.artist.display_name || "Unknown Artist"}
          </Link>
        )}
      </div>

      {/* Duration */}
      <span className="text-sm text-muted-foreground">
        {track.duration ? formatDuration(track.duration) : "--:--"}
      </span>

      {/* Unlike button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-primary hover:text-destructive transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onUnlike();
        }}
      >
        <Heart className="w-4 h-4 fill-current" />
      </Button>
    </div>
  );
}

export default function LikedSongsDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { playTrack, currentTrack, isPlaying, clearQueue, addToQueue, togglePlayPause } = useAudioPlayer();
  const { toggleLike } = useLikes();

  const { data: likedTracks, isLoading } = useLikedTracks();
  const [sortBy, setSortBy] = useState<SortOption>("recently-liked");

  // Sort tracks based on selected option
  const sortedTracks = useMemo(() => {
    if (!likedTracks) return [];
    
    const tracks = [...likedTracks];
    
    switch (sortBy) {
      case "alphabetical":
        return tracks.sort((a, b) => a.title.localeCompare(b.title));
      case "artist":
        return tracks.sort((a, b) => 
          (a.artist?.display_name || "").localeCompare(b.artist?.display_name || "")
        );
      case "recently-liked":
      default:
        return tracks.sort((a, b) => 
          new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime()
        );
    }
  }, [likedTracks, sortBy]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    if (!likedTracks) return 0;
    return likedTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  }, [likedTracks]);

  const handlePlayTrack = (track: LikedTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      price: track.price,
      artist: track.artist,
    });
  };


  const handlePlayAll = () => {
    if (sortedTracks.length === 0) return;
    clearQueue();
    const firstTrack = sortedTracks[0];
    playTrack({
      id: firstTrack.id,
      title: firstTrack.title,
      audio_url: firstTrack.audio_url,
      cover_art_url: firstTrack.cover_art_url,
      duration: firstTrack.duration,
      price: firstTrack.price,
      artist: firstTrack.artist,
    });
    sortedTracks.slice(1).forEach((track) => {
      addToQueue({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        price: track.price,
        artist: track.artist,
      });
    });
    showFeedback({
      type: "success",
      title: "Now Playing",
      message: `Playing ${sortedTracks.length} liked songs`,
    });
  };

  const handleShufflePlay = () => {
    if (sortedTracks.length === 0) return;
    clearQueue();
    const shuffled = [...sortedTracks].sort(() => Math.random() - 0.5);
    const firstTrack = shuffled[0];
    playTrack({
      id: firstTrack.id,
      title: firstTrack.title,
      audio_url: firstTrack.audio_url,
      cover_art_url: firstTrack.cover_art_url,
      duration: firstTrack.duration,
      price: firstTrack.price,
      artist: firstTrack.artist,
    });
    shuffled.slice(1).forEach((track) => {
      addToQueue({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url,
        duration: track.duration,
        price: track.price,
        artist: track.artist,
      });
    });
    showFeedback({
      type: "success",
      title: "Shuffle Play",
      message: `Playing ${sortedTracks.length} liked songs shuffled`,
    });
  };

  const handleUnlike = (trackId: string) => {
    toggleLike(trackId);
    showFeedback({
      type: "info",
      title: "Removed from Liked Songs",
      message: "Track removed from your liked songs",
    });
  };

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
          onClick={() => navigate("/library")}
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
              {/* Gradient Heart Cover */}
              <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 mx-auto md:mx-0 bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
                <Heart className="w-20 h-20 text-white fill-white" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-2">Playlist</p>
                <h1 className="text-3xl font-bold mb-2">Liked Songs</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {likedTracks?.length || 0} {(likedTracks?.length || 0) === 1 ? "song" : "songs"} · {formatDuration(totalDuration)}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                  <Button
                    className="gradient-accent neon-glow-subtle"
                    onClick={handlePlayAll}
                    disabled={!likedTracks || likedTracks.length === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShufflePlay}
                    disabled={!likedTracks || likedTracks.length === 0}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle
                  </Button>
                </div>
              </div>
            </div>

            {/* Sort header */}
            <div className="flex items-center justify-between mb-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently-liked">Recently Liked</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Track list */}
            {sortedTracks.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No liked songs yet</h2>
                <p className="text-muted-foreground mb-6">
                  Like songs to add them here
                </p>
                <Button onClick={() => navigate("/browse")}>
                  Browse Music
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-500px)] min-h-[300px]">
                <div className="space-y-1">
                  {sortedTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPlay={() => handlePlayTrack(track)}
                      onUnlike={() => handleUnlike(track.id)}
                      isPlaying={isPlaying}
                      isCurrentTrack={currentTrack?.id === track.id}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
