import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Disc3, Play, Pause, Heart, Loader2, ListPlus, UserPlus, UserMinus, Users, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublishedTracks } from "@/hooks/useTracks";
import { formatPrice, formatEditions, formatCompactNumber } from "@/lib/formatters";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLikes } from "@/hooks/useLikes";
import { useLikeCounts } from "@/hooks/useLikeCounts";
import { useFollow } from "@/hooks/useFollows";
import { useFollowerCounts } from "@/hooks/useFollowerCounts";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { DownloadButton } from "@/components/download/DownloadButton";
import { usePurchases } from "@/hooks/usePurchases";

const genres = ["All", "Electronic", "Hip Hop", "R&B", "Pop", "Rock", "Jazz", "Classical", "Indie"];

export default function Browse() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();
  const { isLiked, toggleLike } = useLikes();
  const { isFollowing, toggleFollow } = useFollow();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { isOwned } = usePurchases();
  
  const { data: tracks, isLoading } = usePublishedTracks({
    genre: selectedGenre,
    searchQuery: searchQuery || undefined,
  });

  const trackIds = useMemo(() => tracks?.map((t) => t.id) || [], [tracks]);
  const artistIds = useMemo(() => {
    const ids = tracks?.map((t) => t.artist?.id).filter(Boolean) as string[] || [];
    return [...new Set(ids)];
  }, [tracks]);
  
  const { data: likeCounts = {} } = useLikeCounts(trackIds);
  const { data: followerCounts = {} } = useFollowerCounts(artistIds);

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

  const handleFollow = async (artistId: string, artistName: string) => {
    if (!user) {
      showFeedback({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in to follow artists",
      });
      return;
    }
    try {
      const result = await toggleFollow(artistId, artistName);
      showFeedback({
        type: "success",
        title: result.action === "followed" ? "Following" : "Unfollowed",
        message: result.artistName || "Artist",
        autoCloseDelay: 2000,
      });
    } catch {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to update follow status",
      });
    }
  };

  const handleAddToQueue = (track: typeof tracks extends (infer T)[] ? T : never) => {
    if (!canUseFeature("addToQueue")) {
      setShowPremiumModal(true);
      return;
    }
    
    addToQueue({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      artist: track.artist,
    });
    showFeedback({
      type: "success",
      title: "Added to queue",
      message: track.title,
      autoCloseDelay: 2000,
    });
  };

  return (
    <Layout>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Music</h1>
          <p className="text-muted-foreground">Discover and collect exclusive tracks from talented artists</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search tracks, artists, or genres..."
              className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Genre Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === genre
                  ? "bg-primary text-primary-foreground neon-glow-subtle"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Track Grid */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => {
              const artistId = track.artist?.id;
              const artistName = track.artist?.display_name || "Unknown Artist";
              const following = artistId ? isFollowing(artistId) : false;
              const isOwnTrack = user?.id === artistId;
              const artistFollowers = artistId ? followerCounts[artistId] || 0 : 0;

              return (
                <div
                  key={track.id}
                  className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                >
                  {/* Album Art */}
                  <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
                    {track.cover_art_url ? (
                      <img
                        src={track.cover_art_url}
                        alt={track.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Disc3 className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        size="icon" 
                        className="rounded-full gradient-accent neon-glow w-12 h-12"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack({
                            id: track.id,
                            title: track.title,
                            audio_url: track.audio_url,
                            cover_art_url: track.cover_art_url,
                            duration: track.duration,
                            artist: track.artist,
                          });
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </Button>
                    </div>
                    {/* Like Button with Count */}
                    <button 
                      className={`absolute top-2 right-2 px-2 py-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-105 flex items-center gap-1 ${
                        isLiked(track.id) 
                          ? "bg-primary/20 text-primary" 
                          : "bg-background/50 text-foreground hover:bg-background/80"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(track.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isLiked(track.id) ? "fill-current" : ""}`} />
                      {(likeCounts[track.id] || 0) > 0 && (
                        <span className="text-xs font-medium">{likeCounts[track.id]}</span>
                      )}
                    </button>
                    {/* Add to Queue Button */}
                    <button 
                      className="absolute top-2 left-2 p-2 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToQueue(track);
                      }}
                      title={canUseFeature("addToQueue") ? "Add to queue" : "Premium feature"}
                    >
                      <ListPlus className="w-4 h-4 text-foreground" />
                      {!canUseFeature("addToQueue") && (
                        <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />
                      )}
                    </button>
                    {/* Download Button */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DownloadButton
                        track={{
                          id: track.id,
                          title: track.title,
                          cover_art_url: track.cover_art_url,
                          price: track.price,
                          audio_url: track.audio_url,
                          artist: track.artist ? { display_name: track.artist.display_name } : undefined,
                        }}
                        isOwned={isOwned(track.id)}
                        variant="ghost"
                        size="icon"
                        className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
                      />
                    </div>
                  </div>

                  {/* Track Info */}
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Link
                        to={`/artist/${track.artist?.id}`}
                        className="text-sm text-muted-foreground truncate hover:text-primary transition-colors flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {artistName}
                      </Link>
                      {artistId && !isOwnTrack && (
                        <button
                          className={`p-1 rounded-full transition-colors ${
                            following
                              ? "text-primary"
                              : "text-muted-foreground hover:text-primary"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(artistId, artistName);
                          }}
                          title={following ? "Unfollow" : "Follow"}
                        >
                          {following ? (
                            <UserMinus className="w-3.5 h-3.5" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    {artistFollowers > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{formatCompactNumber(artistFollowers)} fans</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-primary">{formatPrice(track.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEditions(track.editions_sold, track.total_editions)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <Disc3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tracks found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedGenre !== "All"
                ? "Try adjusting your filters or search query"
                : "Be the first to upload music!"}
            </p>
          </div>
        )}

        {/* Load More */}
        {tracks && tracks.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-glass-border hover:border-primary/50 px-8">
              Load More
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
