import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Disc3, Play, Pause, Heart, Loader2, ListPlus, UserPlus, UserMinus, Users, Lock, X, Mic2, Album, Star } from "lucide-react";
import { TrackCardSkeletonGrid } from "@/components/dashboard/TrackCardSkeleton";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { RecentlyViewedSection } from "@/components/browse/RecentlyViewedSection";
import { HeroCarousel } from "@/components/browse/HeroCarousel";
import { AlbumCard } from "@/components/browse/AlbumCard";
import { Link } from "react-router-dom";
import { useInfinitePublishedTracks } from "@/hooks/useTracks";
import { useBrowsePreferences } from "@/hooks/useBrowsePreferences";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
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
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFeaturedAlbums } from "@/hooks/useFeaturedContent";

const genres = ["All", "Electronic", "Hip Hop", "R&B", "Pop", "Rock", "Jazz", "Classical", "Indie"];
const moods = ["All", "Chill", "Energetic", "Dark", "Uplifting", "Melancholic", "Romantic", "Aggressive", "Dreamy", "Funky"];

type SortOption = "newest" | "oldest" | "popular" | "price_low" | "price_high";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "popular", label: "Most Popular" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

// Featured Albums Section Component
function FeaturedAlbumsSection() {
  const { data: featuredAlbums, isLoading } = useFeaturedAlbums("browse_page");

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!featuredAlbums || featuredAlbums.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-accent" />
            Featured Albums
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Handpicked releases you'll love</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {featuredAlbums.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            to={`/album/${item.content_id}`}
            className="glass-card group hover:bg-primary/10 transition-all duration-300 overflow-hidden"
          >
            <div className="aspect-square relative overflow-hidden">
              {item.album?.cover_art_url ? (
                <img
                  src={item.album.cover_art_url}
                  alt={item.album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                  <Album className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent/90 text-accent-foreground backdrop-blur-sm">
                  <Star className="w-3 h-3" />
                  Featured
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {item.album?.title || "Unknown Album"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {item.album?.artist_name || "Unknown Artist"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                  {item.album?.release_type || "Album"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Browse() {
  const {
    genre: selectedGenre,
    mood: selectedMood,
    sortBy,
    karaokeOnly,
    setGenre: setSelectedGenre,
    setMood: setSelectedMood,
    setSortBy,
    setKaraokeOnly,
    clearFilters,
    hasActiveFilters,
  } = useBrowsePreferences();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<typeof tracks[number] | null>(null);
  const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();
  const { isLiked, toggleLike } = useLikes();
  const { isFollowing, toggleFollow } = useFollow();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { isOwned } = usePurchases();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePublishedTracks({
    genre: selectedGenre,
    mood: selectedMood,
    sortBy,
    karaokeOnly,
    searchQuery: searchQuery || undefined,
  });

  // Flatten pages into single tracks array
  const tracks = useMemo(() => {
    return data?.pages.flatMap((page) => page.tracks) || [];
  }, [data]);

  // Fetch published albums
  const { data: albums = [] } = useQuery({
    queryKey: ["browse-albums", selectedGenre],
    queryFn: async () => {
      let query = supabase
        .from("albums")
        .select(`
          id, title, cover_art_url, release_type, genre, total_price,
          artist:profiles_public!albums_artist_id_fkey(id, display_name, avatar_url)
        `)
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (selectedGenre !== "All") {
        query = query.eq("genre", selectedGenre);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);
  const artistIds = useMemo(() => {
    const ids = tracks.map((t) => t.artist?.id).filter(Boolean) as string[];
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

  // Handle track click to open detail modal and add to recently viewed
  const handleTrackClick = (track: typeof tracks[number]) => {
    setSelectedTrack(track);
    addToRecentlyViewed({
      id: track.id,
      title: track.title,
      cover_art_url: track.cover_art_url,
      artist_id: track.artist?.id || "",
      artist_name: track.artist?.display_name || "Unknown Artist",
      price: track.price,
    });
  };

  return (
    <Layout>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />
      
      {/* Track Detail Modal */}
      {selectedTrack && (
        <TrackDetailModal
          track={{
            ...selectedTrack,
            editions_sold: selectedTrack.editions_sold,
            total_editions: selectedTrack.total_editions,
          }}
          open={!!selectedTrack}
          onOpenChange={(open) => !open && setSelectedTrack(null)}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Featured Albums Section */}
        <FeaturedAlbumsSection />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Music</h1>
          <p className="text-muted-foreground">Discover and collect exclusive tracks from talented artists</p>
        </div>

        {/* Recently Viewed Section */}
        <RecentlyViewedSection
          onTrackClick={(viewedTrack) => {
            // Find full track data or just open with basic info
            const fullTrack = tracks.find((t) => t.id === viewedTrack.id);
            if (fullTrack) {
              handleTrackClick(fullTrack);
            }
          }}
        />

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
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Genre</h3>
          <div className="flex flex-wrap gap-2">
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
        </div>

        {/* Mood Pills */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Mood</h3>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedMood === mood
                    ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Sort & Clear Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {/* Karaoke Filter Toggle */}
            <button
              onClick={() => setKaraokeOnly(!karaokeOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                karaokeOnly
                  ? "bg-primary text-primary-foreground neon-glow-subtle"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Mic2 className="w-4 h-4" />
              <span>Sing-along</span>
            </button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}
            {(selectedGenre !== "All" || selectedMood !== "All" || karaokeOnly) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {selectedGenre !== "All" && (
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                    {selectedGenre}
                  </span>
                )}
                {selectedMood !== "All" && (
                  <span className="px-2 py-1 rounded-md bg-accent/50 text-accent-foreground text-xs">
                    {selectedMood}
                  </span>
                )}
                {karaokeOnly && (
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs flex items-center gap-1">
                    <Mic2 className="w-3 h-3" />
                    Sing-along
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px] bg-muted/50 border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Albums Section */}
        {albums && albums.length > 0 && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Album className="w-6 h-6 text-primary" />
                Albums & EPs
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {albums.map((album) => (
                <AlbumCard 
                  key={album.id} 
                  album={{
                    ...album,
                    artist: album.artist?.[0] || null,
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Tracks Section Header */}
        {albums && albums.length > 0 && !searchQuery && (
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Disc3 className="w-6 h-6 text-primary" />
            Tracks
          </h2>
        )}

        {/* Track Grid */}
        {isLoading ? (
          <TrackCardSkeletonGrid count={10} />
        ) : tracks && tracks.length > 0 ? (
          <motion.div
            key={`${selectedGenre}-${selectedMood}-${sortBy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {tracks.map((track, index) => {
                const artistId = track.artist?.id;
                const artistName = track.artist?.display_name || "Unknown Artist";
                const following = artistId ? isFollowing(artistId) : false;
                const isOwnTrack = user?.id === artistId;
                const artistFollowers = artistId ? followerCounts[artistId] || 0 : 0;

                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                    onClick={() => handleTrackClick(track)}
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
                        {track.featuredArtists && track.featuredArtists.length > 0 && (
                          <span className="text-muted-foreground/70">
                            {" feat. "}
                            {track.featuredArtists.map((a) => a.display_name).join(", ")}
                          </span>
                        )}
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
                    {/* Mood Tags */}
                    {track.moods && track.moods.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {track.moods.slice(0, 3).map((mood) => (
                          <span
                            key={mood}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/50 text-accent-foreground/80"
                          >
                            {mood}
                          </span>
                        ))}
                        {track.moods.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{track.moods.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-primary">{formatPrice(track.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEditions(track.editions_sold, track.total_editions)}
                      </span>
                    </div>
                  </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
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

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="py-8">
          {isFetchingNextPage && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!hasNextPage && tracks.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              You've reached the end
            </p>
          )}
        </div>
        <ScrollToTop />
      </div>
    </Layout>
  );
}
