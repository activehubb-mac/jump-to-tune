import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Disc3, Play, Pause, Heart, Loader2, ListPlus, Lock, Mic2 } from "lucide-react";
import { TrackCardSkeletonGrid } from "@/components/dashboard/TrackCardSkeleton";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, formatCompactNumber } from "@/lib/formatters";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLikes } from "@/hooks/useLikes";
import { useLikeCounts } from "@/hooks/useLikeCounts";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { DownloadButton } from "@/components/download/DownloadButton";
import { usePurchases } from "@/hooks/usePurchases";
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";

const PAGE_SIZE = 20;

function useKaraokeTracks(searchQuery?: string) {
  return useInfiniteQuery({
    queryKey: ["karaoke-tracks", searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("tracks")
        .select("*")
        .eq("is_draft", false)
        .eq("has_karaoke", true)
        .order("editions_sold", { ascending: false });

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      query = query.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data: tracks, error } = await query;

      if (error) throw error;
      if (!tracks || tracks.length === 0) return { tracks: [], nextPage: null };

      // Fetch artist profiles
      const artistIds = [...new Set(tracks.map((t) => t.artist_id).filter(Boolean))];

      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      const enrichedTracks = tracks.map((track) => ({
        ...track,
        artist: artistMap.get(track.artist_id) || null,
      }));

      return {
        tracks: enrichedTracks,
        nextPage: tracks.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export default function Karaoke() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();
  const { isLiked, toggleLike } = useLikes();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { isOwned } = usePurchases();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useKaraokeTracks(searchQuery || undefined);

  const tracks = useMemo(() => {
    return data?.pages.flatMap((page) => page.tracks) || [];
  }, [data]);

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

  const handleAddToQueue = (track: any) => {
    if (!canUseFeature("addToQueue")) {
      setShowPremiumModal(true);
      return;
    }
    addToQueue({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      has_karaoke: track.has_karaoke,
      artist: track.artist ? { id: track.artist.id, display_name: track.artist.display_name } : undefined,
    });
    showFeedback({
      type: "success",
      title: "Added to queue",
      message: `${track.title} has been added to your queue`,
    });
  };

  const handleTrackClick = (track: any) => {
    setSelectedTrack(track);
  };

  return (
    <Layout>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Mic2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Sing-Along</h1>
              <p className="text-muted-foreground">Tracks with karaoke mode — instrumental versions with synced lyrics</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search karaoke tracks..."
              className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Track Grid */}
        {isLoading ? (
          <TrackCardSkeletonGrid count={10} />
        ) : tracks && tracks.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {tracks.map((track, index) => {
                const artistName = track.artist?.display_name || "Unknown Artist";
                const artistId = track.artist?.id;

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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}

                      {/* Karaoke Badge */}
                      <span className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-primary/90 text-primary-foreground" title="Sing-along available">
                        <Mic2 className="w-4 h-4" />
                      </span>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrack({
                              id: track.id,
                              title: track.title,
                              audio_url: track.audio_url,
                              cover_art_url: track.cover_art_url,
                              has_karaoke: track.has_karaoke,
                              artist: track.artist ? { id: track.artist.id, display_name: track.artist.display_name } : undefined,
                            });
                          }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow"
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue(track);
                          }}
                          className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 relative"
                          title={canUseFeature("addToQueue") ? "Add to queue" : "Subscribe to add to queue"}
                        >
                          {canUseFeature("addToQueue") ? (
                            <ListPlus className="w-5 h-5 text-white" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/70" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(track.id);
                          }}
                          className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
                        >
                          <Heart
                            className={`w-5 h-5 ${isLiked(track.id) ? "fill-red-500 text-red-500" : "text-white"}`}
                          />
                        </button>

                        <div onClick={(e) => e.stopPropagation()}>
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
                            className="w-10 h-10 rounded-full border border-white/30 text-white hover:bg-white/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Track Info */}
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    {artistId ? (
                      <Link
                        to={`/artist/${artistId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block"
                      >
                        {artistName}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground truncate">{artistName}</p>
                    )}

                    {/* Price & Likes */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-accent">
                        {formatPrice(track.price)}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">{formatCompactNumber(likeCounts[track.id] || 0)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Mic2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No karaoke tracks found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term"
                : "No tracks with sing-along mode are available yet"}
            </p>
            <Button variant="outline" asChild>
              <Link to="/browse">Browse All Tracks</Link>
            </Button>
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          )}
        </div>
      </div>

      <ScrollToTop />
    </Layout>
  );
}
