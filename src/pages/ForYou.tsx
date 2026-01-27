import { Layout } from "@/components/layout/Layout";
import { useForYouPlaylist } from "@/hooks/useForYouPlaylist";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  Shuffle,
  ListPlus,
  Heart,
  Music,
  Sparkles,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDuration } from "@/lib/formatters";
import { motion } from "framer-motion";

export default function ForYou() {
  const { user } = useAuth();
  const { data: tracks, isLoading, refetch, isFetching } = useForYouPlaylist(25);
  const { playTrack, addToQueue, clearQueue, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const { isLiked, toggleLike } = useLikes();
  const queryClient = useQueryClient();

  const handlePlayTrack = (track: any, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    // Play the clicked track
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      price: track.price,
      artist: track.artist
        ? { id: track.artist.id, display_name: track.artist.display_name }
        : undefined,
    });

    // Queue the remaining tracks
    const remainingTracks = tracks?.slice(index + 1) || [];
    remainingTracks.forEach((t) => {
      addToQueue({
        id: t.id,
        title: t.title,
        audio_url: t.audio_url,
        cover_art_url: t.cover_art_url,
        duration: t.duration,
        price: t.price,
        artist: t.artist
          ? { id: t.artist.id, display_name: t.artist.display_name }
          : undefined,
      });
    });
  };

  const handlePlayAll = () => {
    if (!tracks || tracks.length === 0) return;

    clearQueue();
    
    // Play first track
    const first = tracks[0];
    playTrack({
      id: first.id,
      title: first.title,
      audio_url: first.audio_url,
      cover_art_url: first.cover_art_url,
      duration: first.duration,
      price: first.price,
      artist: first.artist
        ? { id: first.artist.id, display_name: first.artist.display_name }
        : undefined,
    });

    // Queue the rest
    tracks.slice(1).forEach((t) => {
      addToQueue({
        id: t.id,
        title: t.title,
        audio_url: t.audio_url,
        cover_art_url: t.cover_art_url,
        duration: t.duration,
        price: t.price,
        artist: t.artist
          ? { id: t.artist.id, display_name: t.artist.display_name }
          : undefined,
      });
    });

    toast.success("Playing your personalized playlist");
  };

  const handleShuffle = () => {
    if (!tracks || tracks.length === 0) return;

    clearQueue();
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    
    // Play first shuffled track
    const first = shuffled[0];
    playTrack({
      id: first.id,
      title: first.title,
      audio_url: first.audio_url,
      cover_art_url: first.cover_art_url,
      duration: first.duration,
      price: first.price,
      artist: first.artist
        ? { id: first.artist.id, display_name: first.artist.display_name }
        : undefined,
    });

    // Queue the rest
    shuffled.slice(1).forEach((t) => {
      addToQueue({
        id: t.id,
        title: t.title,
        audio_url: t.audio_url,
        cover_art_url: t.cover_art_url,
        duration: t.duration,
        price: t.price,
        artist: t.artist
          ? { id: t.artist.id, display_name: t.artist.display_name }
          : undefined,
      });
    });

    toast.success("Shuffling your personalized playlist");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["forYouPlaylist"] });
    refetch();
    toast.success("Refreshing recommendations...");
  };

  const handleLike = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to like tracks");
      return;
    }
    toggleLike(trackId);
  };

  const totalDuration = tracks?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-background p-4 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 rounded-full bg-primary/20 backdrop-blur-sm shrink-0">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  For You
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Personalized based on your listening history & likes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Music className="w-4 h-4" />
                {tracks?.length || 0} tracks
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(totalDuration)}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePlayAll}
                className="gradient-accent neon-glow-subtle"
                disabled={!tracks || tracks.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Play All
              </Button>
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="border-glass-border"
                disabled={!tracks || tracks.length === 0}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-glass-border"
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-glass">
                <Skeleton className="w-14 h-14 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="space-y-2">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isTrackPlaying = isCurrentTrack && isPlaying;

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className={`group cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
                      isCurrentTrack ? "bg-primary/5 border-primary/30" : "bg-glass border-glass-border"
                    }`}
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-4">
                        {/* Track Number / Play Button */}
                        <div className="w-8 text-center">
                          <span className="group-hover:hidden text-muted-foreground text-sm">
                            {isCurrentTrack ? (
                              <div className="flex items-center justify-center gap-0.5">
                                <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                                <span className="w-1 h-4 bg-primary rounded-full animate-pulse delay-75" />
                                <span className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150" />
                              </div>
                            ) : (
                              index + 1
                            )}
                          </span>
                          <button className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                            {isTrackPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                        </div>

                        {/* Cover Art */}
                        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {track.cover_art_url ? (
                            <img
                              src={track.cover_art_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isCurrentTrack ? "text-primary" : ""}`}>
                            {track.title}
                          </p>
                          <Link
                            to={`/artist/${track.artist?.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-muted-foreground hover:text-foreground truncate block"
                          >
                            {track.artist?.display_name || "Unknown Artist"}
                          </Link>
                          <p className="text-xs text-primary/70 mt-0.5 truncate">
                            {track.reason}
                          </p>
                        </div>

                        {/* Duration */}
                        <span className="text-sm text-muted-foreground hidden md:block">
                          {track.duration ? formatDuration(track.duration) : "--:--"}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleLike(e, track.id)}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isLiked(track.id)
                                  ? "fill-accent text-accent"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="bg-glass border-glass-border">
            <CardContent className="py-16 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No recommendations yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start listening to music and liking tracks to get personalized recommendations
                tailored just for you.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild className="gradient-accent">
                  <Link to="/browse">
                    <Music className="w-4 h-4 mr-2" />
                    Browse Music
                  </Link>
                </Button>
                {!user && (
                  <Button asChild variant="outline" className="border-glass-border">
                    <Link to="/auth?mode=signin">Sign In</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
