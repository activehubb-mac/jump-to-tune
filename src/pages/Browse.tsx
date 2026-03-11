import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Disc3, Loader2, TrendingUp, Sparkles, Mic2, Clock, Album, Star } from "lucide-react";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { HeroCarousel } from "@/components/browse/HeroCarousel";
import { BrowseFilterBar } from "@/components/browse/BrowseFilterBar";
import { AIDiscoveryBar } from "@/components/browse/AIDiscoveryBar";
import { SearchResultsView } from "@/components/browse/SearchResultsView";
import { RecentlyViewedSection } from "@/components/browse/RecentlyViewedSection";
import { SpotifyTrackCard } from "@/components/browse/SpotifyTrackCard";
import { HorizontalSection, HorizontalSectionItem } from "@/components/browse/HorizontalSection";
import { AlbumCard } from "@/components/browse/AlbumCard";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";
import { Link, useNavigate } from "react-router-dom";
import { useInfinitePublishedTracks } from "@/hooks/useTracks";
import { useBrowsePreferences } from "@/hooks/useBrowsePreferences";
import { useBrowseSearch } from "@/hooks/useBrowseSearch";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { usePurchases } from "@/hooks/usePurchases";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useNewReleases } from "@/hooks/useNewReleases";
import { useTopKaraokeTracks } from "@/hooks/useTopKaraokeTracks";
import { useRecommendedTracks } from "@/hooks/useRecommendedTracks";
import { useFeaturedAlbums } from "@/hooks/useFeaturedContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [playlistTrackId, setPlaylistTrackId] = useState<string | null>(null);
  const [playlistTrackTitle, setPlaylistTrackTitle] = useState("");
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { isLiked, toggleLike } = useLikes();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const navigate = useNavigate();

  // Data hooks
  const { data: trendingTracks, isLoading: trendingLoading } = useTrendingTracks(12);
  const { data: newReleases, isLoading: newReleasesLoading } = useNewReleases(12, 14);
  const { data: karaokeTracks, isLoading: karaokeLoading } = useTopKaraokeTracks(12);
  const { data: recommendedTracks, isLoading: recommendedLoading } = useRecommendedTracks(12);
  const { data: featuredAlbums } = useFeaturedAlbums("browse_page");

  // Search
  const {
    tracks: searchTracks,
    artists: searchArtists,
    labels: searchLabels,
    albums: searchAlbums,
    isLoading: searchLoading,
  } = useBrowseSearch(searchQuery);
  const isSearchMode = searchQuery.trim().length >= 2;
  const searchResults = { tracks: searchTracks, artists: searchArtists, labels: searchLabels, albums: searchAlbums };

  // Browse albums
  const { data: albums = [] } = useQuery({
    queryKey: ["browse-albums", selectedGenre],
    queryFn: async () => {
      let query = supabase
        .from("albums")
        .select("id, title, cover_art_url, release_type, genre, total_price, artist_id")
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (selectedGenre !== "All") query = query.eq("genre", selectedGenre);
      const { data: albumsData, error } = await query;
      if (error) throw error;
      if (!albumsData?.length) return [];
      const artistIds = [...new Set(albumsData.map((a) => a.artist_id).filter(Boolean))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);
      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);
      return albumsData.map((album) => ({ ...album, artist: artistMap.get(album.artist_id) || null }));
    },
  });

  // Filtered all-tracks for grid view (only shown when filters active)
  const {
    data: filteredData,
    isLoading: filteredLoading,
    refetch,
  } = useInfinitePublishedTracks({
    genre: selectedGenre,
    mood: selectedMood,
    sortBy,
    karaokeOnly,
  });
  const filteredTracks = useMemo(() => filteredData?.pages.flatMap((p) => p.tracks) || [], [filteredData]);

  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);

  const handleLike = (trackId: string) => {
    if (!user) {
      showFeedback({ type: "warning", title: "Sign in required", message: "Please sign in to like tracks" });
      return;
    }
    toggleLike(trackId);
  };

  const handleTrackClick = (track: any) => {
    setSelectedTrack(track);
    addToRecentlyViewed({
      id: track.id,
      title: track.title,
      cover_art_url: track.cover_art_url,
      audio_url: track.audio_url,
      duration: track.duration,
      artist_id: track.artist_id || track.artist?.id || "",
      artist_name: track.artist_name || track.artist?.display_name || "Unknown Artist",
      price: track.price || 0,
    });
  };

  const handlePlay = (track: any) => {
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      price: track.price,
      artist: track.artist || { id: track.artist_id, display_name: track.artist_name },
    });
  };

  const handleAddToPlaylist = (trackId: string, trackTitle?: string) => {
    if (!user) {
      showFeedback({ type: "warning", title: "Sign in required", message: "Please sign in to add to playlist" });
      return;
    }
    setPlaylistTrackId(trackId);
    setPlaylistTrackTitle(trackTitle || "");
  };

  const handleKaraoke = (trackId: string) => {
    navigate(`/karaoke/${trackId}`);
  };

  // Render a SpotifyTrackCard for any track-like object
  const renderCard = (track: any) => (
    <HorizontalSectionItem key={track.id}>
      <SpotifyTrackCard
        id={track.id}
        title={track.title}
        artistName={track.artist_name || track.artist?.display_name || "Unknown Artist"}
        artistId={track.artist_id || track.artist?.id}
        coverArtUrl={track.cover_art_url}
        audioUrl={track.audio_url}
        duration={track.duration}
        price={track.price}
        hasKaraoke={track.has_karaoke}
        isCurrentTrack={currentTrack?.id === track.id}
        isPlaying={currentTrack?.id === track.id && isPlaying}
        isLiked={isLiked(track.id)}
        onPlay={() => handlePlay(track)}
        onLike={() => handleLike(track.id)}
        onAddToPlaylist={() => handleAddToPlaylist(track.id)}
        onKaraoke={track.has_karaoke ? () => handleKaraoke(track.id) : undefined}
        onClick={() => handleTrackClick(track)}
        artist={track.artist}
      />
    </HorizontalSectionItem>
  );

  // Render a card for the filtered grid view
  const renderGridCard = (track: any) => (
    <SpotifyTrackCard
      key={track.id}
      id={track.id}
      title={track.title}
      artistName={track.artist?.display_name || "Unknown Artist"}
      artistId={track.artist?.id}
      coverArtUrl={track.cover_art_url}
      audioUrl={track.audio_url}
      duration={track.duration}
      price={track.price}
      hasKaraoke={track.has_karaoke}
      isCurrentTrack={currentTrack?.id === track.id}
      isPlaying={currentTrack?.id === track.id && isPlaying}
      isLiked={isLiked(track.id)}
      onPlay={() => handlePlay(track)}
      onLike={() => handleLike(track.id)}
      onAddToPlaylist={() => handleAddToPlaylist(track.id)}
      onKaraoke={track.has_karaoke ? () => handleKaraoke(track.id) : undefined}
      onClick={() => handleTrackClick(track)}
      artist={track.artist}
    />
  );

  const showSections = !hasActiveFilters && !isSearchMode;

  return (
    <Layout>
      <PremiumFeatureModal open={showPremiumModal} onOpenChange={setShowPremiumModal} feature="Add to Queue" />

      {selectedTrack && (
        <TrackDetailModal
          track={{ ...selectedTrack, editions_sold: selectedTrack.editions_sold, total_editions: selectedTrack.total_editions }}
          open={!!selectedTrack}
          onOpenChange={(open) => !open && setSelectedTrack(null)}
        />
      )}

      {playlistTrackId && (
        <AddToPlaylistModal
          trackId={playlistTrackId}
          trackTitle={playlistTrackTitle}
          open={!!playlistTrackId}
          onOpenChange={(open) => !open && setPlaylistTrackId(null)}
        />
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Hero Carousel */}
          <HeroCarousel />

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">Browse</h1>
            <p className="text-muted-foreground text-sm">Discover and collect exclusive music</p>
          </div>

          {/* AI Discovery Bar */}
          <AIDiscoveryBar />

          {/* Recently Viewed */}
          <RecentlyViewedSection
            onTrackClick={(viewedTrack) => {
              const fullTrack = filteredTracks.find((t) => t.id === viewedTrack.id);
              if (fullTrack) handleTrackClick(fullTrack);
            }}
          />

          {/* Filter Bar */}
          <BrowseFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            selectedMood={selectedMood}
            onMoodChange={setSelectedMood}
            sortBy={sortBy}
            onSortChange={setSortBy}
            karaokeOnly={karaokeOnly}
            onKaraokeChange={setKaraokeOnly}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          {/* Search Results */}
          {isSearchMode ? (
            <SearchResultsView query={searchQuery} results={searchResults} isLoading={searchLoading} />
          ) : showSections ? (
            <>
              {/* ── Trending Tracks ── */}
              {trendingLoading ? (
                <SectionSkeleton title="Trending Tracks" />
              ) : trendingTracks && trendingTracks.length > 0 ? (
                <HorizontalSection
                  title="Trending Tracks"
                  subtitle="Most popular right now"
                  icon={<TrendingUp className="w-5 h-5 text-primary" />}
                >
                  {trendingTracks.map(renderCard)}
                </HorizontalSection>
              ) : null}

              {/* ── New Releases ── */}
              {newReleasesLoading ? (
                <SectionSkeleton title="New Releases" />
              ) : newReleases && newReleases.length > 0 ? (
                <HorizontalSection
                  title="New Releases"
                  subtitle="Fresh drops this week"
                  icon={<Clock className="w-5 h-5 text-accent" />}
                >
                  {newReleases.map(renderCard)}
                </HorizontalSection>
              ) : null}

              {/* ── Featured Albums ── */}
              {featuredAlbums && featuredAlbums.length > 0 && (
                <HorizontalSection
                  title="Featured Albums"
                  subtitle="Handpicked releases"
                  icon={<Star className="w-5 h-5 text-primary" />}
                >
                  {featuredAlbums.map((item) => (
                    <HorizontalSectionItem key={item.id}>
                      <Link
                        to={`/album/${item.content_id}`}
                        className="block group rounded-md bg-card hover:bg-muted p-3 transition-all duration-300"
                      >
                        <div className="aspect-square rounded-md overflow-hidden mb-3 shadow-lg">
                          {item.album?.cover_art_url ? (
                            <img
                              src={item.album.cover_art_url}
                              alt={item.album.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Album className="w-12 h-12 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-foreground text-sm truncate">{item.album?.title}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-1">{item.album?.artist_name}</p>
                      </Link>
                    </HorizontalSectionItem>
                  ))}
                </HorizontalSection>
              )}

              {/* ── Albums & EPs ── */}
              {albums.length > 0 && (
                <HorizontalSection
                  title="Albums & EPs"
                  icon={<Album className="w-5 h-5 text-primary" />}
                >
                  {albums.map((album) => (
                    <HorizontalSectionItem key={album.id}>
                      <AlbumCard album={{ ...album, artist: album.artist || null }} />
                    </HorizontalSectionItem>
                  ))}
                </HorizontalSection>
              )}

              {/* ── Top Karaoke Songs ── */}
              {karaokeLoading ? (
                <SectionSkeleton title="Top Karaoke Songs" />
              ) : karaokeTracks && karaokeTracks.length > 0 ? (
                <HorizontalSection
                  title="Top Karaoke Songs"
                  subtitle="Sing along with the community"
                  icon={<Mic2 className="w-5 h-5 text-accent" />}
                >
                  {karaokeTracks.map(renderCard)}
                </HorizontalSection>
              ) : null}

              {/* ── Recommended For You ── */}
              {recommendedLoading ? (
                <SectionSkeleton title="Recommended For You" />
              ) : recommendedTracks && recommendedTracks.length > 0 ? (
                <HorizontalSection
                  title="Recommended For You"
                  subtitle="Based on your taste"
                  icon={<Sparkles className="w-5 h-5 text-primary" />}
                >
                  {recommendedTracks.map(renderCard)}
                </HorizontalSection>
              ) : null}
            </>
          ) : (
            /* ── Filtered Grid View ── */
            <>
              {filteredLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTracks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredTracks.map(renderGridCard)}
                </div>
              ) : (
                <div className="text-center py-24">
                  <Disc3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No tracks found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters</p>
                </div>
              )}
            </>
          )}

          <ScrollToTop />
        </div>
      </PullToRefresh>
    </Layout>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 px-1">{title}</h2>
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.33%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)]">
            <div className="rounded-md bg-card p-3">
              <div className="aspect-square rounded-md bg-muted/50 mb-3 animate-pulse" />
              <div className="h-4 bg-muted/50 rounded animate-pulse mb-2 w-3/4" />
              <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
