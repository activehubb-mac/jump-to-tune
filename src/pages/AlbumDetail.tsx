import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Disc3, 
  Clock, 
  Calendar, 
  Heart,
  Share2,
  ListPlus,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLikes } from "@/hooks/useLikes";
import { useLikeCounts } from "@/hooks/useLikeCounts";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { formatPrice, formatDuration } from "@/lib/formatters";
import { format } from "date-fns";
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const { playTrack, addToQueue, currentTrack, isPlaying, clearQueue } = useAudioPlayer();
  const { isLiked, toggleLike } = useLikes();
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  // Fetch album
  const { data: album, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("id", id!)
        .eq("is_draft", false)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch album artist
  const { data: artist } = useQuery({
    queryKey: ["album-artist", album?.artist_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .eq("id", album!.artist_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!album?.artist_id,
  });

  // Fetch album tracks
  const { data: tracks = [] } = useQuery({
    queryKey: ["album-tracks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", id!)
        .eq("is_draft", false)
        .order("track_number", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const trackIds = tracks.map((t) => t.id);
  const { data: likeCounts = {} } = useLikeCounts(trackIds);

  const handleLike = (trackId: string) => {
    if (!user) {
      showFeedback({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in to like tracks",
      });
      return;
    }
    toggleLike(trackId);
  };

  const handlePlayAlbum = () => {
    if (tracks.length === 0) return;
    
    // Clear and play album from start
    clearQueue();
    
    const firstTrack = {
      id: tracks[0].id,
      title: tracks[0].title,
      audio_url: tracks[0].audio_url,
      cover_art_url: tracks[0].cover_art_url || album?.cover_art_url,
      duration: tracks[0].duration,
      artist: artist ? { id: artist.id!, display_name: artist.display_name } : undefined,
    };

    playTrack(firstTrack);

    // Add remaining tracks to queue
    tracks.slice(1).forEach((track) => {
      addToQueue({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url || album?.cover_art_url,
        duration: track.duration,
        artist: artist ? { id: artist.id!, display_name: artist.display_name } : undefined,
      });
    });
  };

  const handleAddAlbumToQueue = () => {
    tracks.forEach((track) => {
      addToQueue({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url || album?.cover_art_url || null,
        duration: track.duration,
        artist: artist ? { id: artist.id!, display_name: artist.display_name } : undefined,
      });
    });
    showFeedback({
      type: "success",
      title: "Album added to queue",
      message: `${tracks.length} tracks added`,
      autoCloseDelay: 2000,
    });
  };

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalPrice = tracks.reduce((acc, t) => acc + t.price, 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!album) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Album not found</h1>
          <Button asChild>
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Track Detail Modal */}
      {selectedTrack && (
        <TrackDetailModal
          track={selectedTrack}
          open={!!selectedTrack}
          onOpenChange={(open) => !open && setSelectedTrack(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/browse">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Link>
        </Button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover Art */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 shadow-2xl">
              {album.cover_art_url ? (
                <img
                  src={album.cover_art_url}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 className="w-24 h-24 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Album Info */}
          <div className="flex-1 flex flex-col justify-end">
            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              {album.release_type}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {album.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              {artist?.avatar_url && (
                <img
                  src={artist.avatar_url}
                  alt={artist.display_name || ""}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <Link 
                to={`/artist/${artist?.id}`}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
              >
                {artist?.display_name || "Unknown Artist"}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              {album.genre && (
                <span className="px-3 py-1 rounded-full bg-muted/50">{album.genre}</span>
              )}
              <span className="flex items-center gap-1">
                <Disc3 className="w-4 h-4" />
                {tracks.length} tracks
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(totalDuration)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(album.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg" 
                className="gradient-accent neon-glow"
                onClick={handlePlayAlbum}
                disabled={tracks.length === 0}
              >
                <Play className="w-5 h-5 mr-2" />
                Play Album
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleAddAlbumToQueue}
                disabled={tracks.length === 0}
              >
                <ListPlus className="w-5 h-5 mr-2" />
                Add to Queue
              </Button>
              <Button size="lg" variant="ghost">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Total Price */}
            {totalPrice > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Collect all tracks: <span className="text-foreground font-medium">{formatPrice(totalPrice)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {album.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-muted-foreground">{album.description}</p>
          </div>
        )}

        {/* Track List */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-glass-border">
            <h2 className="text-lg font-semibold">Tracklist</h2>
          </div>
          <div className="divide-y divide-glass-border">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              
              return (
                <div 
                  key={track.id}
                  className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group ${
                    isCurrentTrack ? "bg-primary/10" : ""
                  }`}
                  onClick={() => setSelectedTrack(track)}
                >
                  {/* Track Number / Play Button */}
                  <div className="w-8 flex items-center justify-center">
                    <span className="text-muted-foreground group-hover:hidden">
                      {track.track_number || index + 1}
                    </span>
                    <button
                      className="hidden group-hover:block"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack({
                          id: track.id,
                          title: track.title,
                          audio_url: track.audio_url,
                          cover_art_url: track.cover_art_url || album.cover_art_url,
                          duration: track.duration,
                          artist: artist ? { id: artist.id!, display_name: artist.display_name } : undefined,
                        });
                      }}
                    >
                      {isCurrentTrack && isPlaying ? (
                        <Pause className="w-4 h-4 text-primary" />
                      ) : (
                        <Play className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentTrack ? "text-primary" : "text-foreground"}`}>
                      {track.title}
                    </p>
                    {track.is_explicit && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        E
                      </span>
                    )}
                  </div>

                  {/* Like Button */}
                  <button
                    className={`p-2 rounded-full transition-colors ${
                      isLiked(track.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(track.id);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${isLiked(track.id) ? "fill-current" : ""}`} />
                  </button>

                  {/* Duration */}
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {formatDuration(track.duration || 0)}
                  </span>

                  {/* Price */}
                  <span className="text-sm font-medium w-16 text-right">
                    {track.price > 0 ? formatPrice(track.price) : "Free"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
