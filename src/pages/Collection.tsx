import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Plus, User } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionStats, useOwnedTracks } from "@/hooks/useCollectionStats";
import { useLikedTracks } from "@/hooks/useLikes";
import { useFollowedArtists } from "@/hooks/useFollows";
import { usePlaylists } from "@/hooks/usePlaylists";
import { usePurchases } from "@/hooks/usePurchases";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { LibraryFilterBar, LibraryFilter } from "@/components/library/LibraryFilterBar";
import { LibrarySortHeader, SortOption, ViewMode } from "@/components/library/LibrarySortHeader";
import { LibraryListItem, LibraryItemType } from "@/components/library/LibraryListItem";
import { SwipeableLibraryItem } from "@/components/library/SwipeableLibraryItem";
import { OwnedTrackCard } from "@/components/library/OwnedTrackCard";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { RecentlyPlayedCarousel } from "@/components/library/RecentlyPlayedCarousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UnifiedLibraryItem {
  id: string;
  title: string;
  subtitle: string;
  type: LibraryItemType;
  imageUrl?: string | null;
  trackCount?: number;
  isPinned?: boolean;
  isDownloaded?: boolean;
  isOwned?: boolean;
  linkTo?: string;
  audioData?: {
    audio_url: string;
    duration: number | null;
    artist?: {
      id: string;
      display_name: string | null;
    };
  };
  createdAt?: string;
  sortName?: string;
  creator?: string;
}

interface OwnedAlbum {
  id: string;
  title: string;
  cover_art_url: string | null;
  artist_name: string | null;
  trackCount: number;
}

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get("filter") as LibraryFilter) || "all";
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recents");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const { user, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCollectionStats(user?.id);
  const { data: ownedTracks, isLoading: tracksLoading } = useOwnedTracks(user?.id);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { data: followedArtists, isLoading: followingLoading } = useFollowedArtists();
  const { playlists, isLoading: playlistsLoading, createPlaylist, deletePlaylist } = usePlaylists();
  
  const { isOwned } = usePurchases();
  const { showFeedback } = useFeedbackSafe();

  // Fetch albums from owned tracks
  const albumIds = useMemo(() => {
    if (!ownedTracks) return [];
    const ids = ownedTracks
      .filter(p => p.track?.album_id)
      .map(p => p.track!.album_id!);
    return [...new Set(ids)];
  }, [ownedTracks]);

  const { data: ownedAlbums, isLoading: albumsLoading } = useQuery({
    queryKey: ["owned-albums", albumIds],
    queryFn: async (): Promise<OwnedAlbum[]> => {
      if (albumIds.length === 0) return [];

      const { data: albums, error } = await supabase
        .from("albums")
        .select("id, title, cover_art_url, artist_id")
        .in("id", albumIds);

      if (error) throw error;
      if (!albums || albums.length === 0) return [];

      // Get artist names
      const artistIds = [...new Set(albums.map(a => a.artist_id))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map(a => [a.id, a.display_name]) || []);

      // Count tracks per album from owned tracks
      const trackCountMap = new Map<string, number>();
      ownedTracks?.forEach(p => {
        if (p.track?.album_id) {
          trackCountMap.set(p.track.album_id, (trackCountMap.get(p.track.album_id) || 0) + 1);
        }
      });

      return albums.map(album => ({
        id: album.id,
        title: album.title,
        cover_art_url: album.cover_art_url,
        artist_name: artistMap.get(album.artist_id) || "Unknown Artist",
        trackCount: trackCountMap.get(album.id) || 0,
      }));
    },
    enabled: albumIds.length > 0,
  });

  // Update URL when filter changes
  const handleFilterChange = useCallback((filter: LibraryFilter) => {
    setActiveFilter(filter);
    if (filter === "all") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", filter);
    }
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["collection-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["owned-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["liked-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["followed-artists"] }),
      queryClient.invalidateQueries({ queryKey: ["playlists"] }),
    ]);
  }, [queryClient]);

  // Build unified library items
  const unifiedItems = useMemo<UnifiedLibraryItem[]>(() => {
    const items: UnifiedLibraryItem[] = [];
    
    // Add Liked Songs as first item (always present if user has liked tracks)
    if (likedTracks && likedTracks.length > 0) {
      items.push({
        id: "liked-songs",
        title: "Liked Songs",
        subtitle: "",
        type: "liked-songs",
        trackCount: likedTracks.length,
        isPinned: true,
        isDownloaded: true,
        linkTo: "/library?filter=liked",
        createdAt: new Date().toISOString(),
        sortName: "Liked Songs",
        creator: "You",
      });
    }

    // Add playlists
    if (playlists) {
      playlists.forEach(playlist => {
        items.push({
          id: playlist.id,
          title: playlist.name,
          subtitle: profile?.display_name || "You",
          type: "playlist",
          imageUrl: playlist.cover_image_url,
          trackCount: playlist.track_count,
          isPinned: false,
          linkTo: `/playlist/${playlist.id}`,
          createdAt: playlist.created_at,
          sortName: playlist.name,
          creator: profile?.display_name || "You",
        });
      });
    }

    // Add owned/downloaded tracks
    if (ownedTracks) {
      ownedTracks.forEach(purchase => {
        if (purchase.track) {
          items.push({
            id: purchase.track.id,
            title: purchase.track.title,
            subtitle: purchase.track.artist?.display_name || "Unknown Artist",
            type: "track",
            imageUrl: purchase.track.cover_art_url,
            isDownloaded: true,
            isOwned: true,
            audioData: {
              audio_url: purchase.track.audio_url,
              duration: purchase.track.duration,
              artist: purchase.track.artist || undefined,
            },
            createdAt: purchase.purchased_at,
            sortName: purchase.track.title,
            creator: purchase.track.artist?.display_name || "Unknown",
          });
        }
      });
    }

    // Add followed artists
    if (followedArtists) {
      followedArtists.forEach(artist => {
        items.push({
          id: artist.id,
          title: artist.display_name || "Unknown Artist",
          subtitle: "",
          type: "artist",
          imageUrl: artist.avatar_url,
          linkTo: artist.role === "label" ? `/label/${artist.id}` : `/artist/${artist.id}`,
          createdAt: artist.followed_at,
          sortName: artist.display_name || "",
          creator: "",
        });
      });
    }

    return items;
  }, [likedTracks, playlists, ownedTracks, followedArtists, profile]);

  // Filter items based on active filter and search
  const filteredItems = useMemo(() => {
    let items = unifiedItems;

    // Apply type filter
    switch (activeFilter) {
      case "playlists":
        items = items.filter(i => i.type === "playlist" || i.type === "liked-songs");
        break;
      case "albums":
        // Albums filter is handled separately
        return [];
      case "artists":
        items = items.filter(i => i.type === "artist");
        break;
      case "owned":
        items = items.filter(i => i.isOwned || i.isDownloaded);
        break;
      case "liked":
        // Show liked tracks grid instead
        return [];
      default:
        // Show all
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(i => 
        i.title.toLowerCase().includes(query) ||
        i.subtitle.toLowerCase().includes(query)
      );
    }

    // Apply sort
    switch (sortBy) {
      case "alphabetical":
        items = [...items].sort((a, b) => (a.sortName || "").localeCompare(b.sortName || ""));
        break;
      case "creator":
        items = [...items].sort((a, b) => (a.creator || "").localeCompare(b.creator || ""));
        break;
      case "recently-added":
      case "recents":
      default:
        // Keep pinned items at top, then sort by date
        items = [...items].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        break;
    }

    return items;
  }, [unifiedItems, activeFilter, searchQuery, sortBy]);

  const handleCreatePlaylist = async (data: { name: string; description?: string }) => {
    await createPlaylist.mutateAsync(data);
    showFeedback({
      type: "success",
      title: "Playlist created",
      message: `"${data.name}" has been created`,
    });
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    await deletePlaylist.mutateAsync(playlistId);
    showFeedback({
      type: "success",
      title: "Playlist deleted",
      message: `"${playlistName}" has been deleted`,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Collection Awaits</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to view your music collection and manage your playlists.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="gradient-accent neon-glow-subtle" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="outline" className="border-glass-border" asChild>
                <Link to="/auth?mode=signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isDataLoading = statsLoading || tracksLoading || likedLoading || followingLoading || playlistsLoading || albumsLoading;

  // Render albums grid when filter is "albums"
  const renderAlbumsGrid = () => {
    if (!ownedAlbums || ownedAlbums.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No albums from owned tracks yet
        </div>
      );
    }

    const filteredAlbums = searchQuery
      ? ownedAlbums.filter(a => 
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : ownedAlbums;

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAlbums.map((album) => (
            <Link
              key={album.id}
              to={`/album/${album.id}`}
              className="glass-card p-4 group hover:bg-primary/10 transition-all"
            >
              <div className="aspect-square rounded-lg bg-muted/50 mb-3 overflow-hidden">
                {album.cover_art_url ? (
                  <img
                    src={album.cover_art_url}
                    alt={album.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">💿</span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-foreground truncate">{album.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {album.artist_name} • {album.trackCount} track{album.trackCount !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {filteredAlbums.map((album) => (
          <LibraryListItem
            key={album.id}
            id={album.id}
            title={album.title}
            subtitle={`${album.artist_name} • ${album.trackCount} track${album.trackCount !== 1 ? "s" : ""}`}
            type="album"
            imageUrl={album.cover_art_url}
            trackCount={album.trackCount}
            linkTo={`/album/${album.id}`}
          />
        ))}
      </div>
    );
  };

  // Render liked tracks grid when filter is "liked"
  const renderLikedTracksGrid = () => {
    if (!likedTracks || likedTracks.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No liked tracks yet
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {likedTracks.map((track) => (
            <OwnedTrackCard
              key={track.id}
              track={{
                id: track.id,
                title: track.title,
                audio_url: track.audio_url || "",
                cover_art_url: track.cover_art_url,
                duration: track.duration,
                price: track.price,
                artist: track.artist,
              }}
              showAddToQueue={false}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {likedTracks.map((track) => (
          <LibraryListItem
            key={track.id}
            id={track.id}
            title={track.title}
            subtitle={track.artist?.display_name || "Unknown Artist"}
            type="track"
            imageUrl={track.cover_art_url}
            isOwned={isOwned(track.id)}
            audioData={{
              audio_url: track.audio_url || "",
              duration: track.duration,
              artist: track.artist || undefined,
            }}
          />
        ))}
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    if (activeFilter === "albums") {
      return renderAlbumsGrid();
    }

    if (activeFilter === "liked") {
      return renderLikedTracksGrid();
    }

    const playlistItems = filteredItems.filter(i => i.type === "playlist");
    const trackItems = filteredItems.filter(i => i.type === "track" && i.isOwned);
    const artistItems = filteredItems.filter(i => i.type === "artist");

    return (
      <div className="space-y-8">
        {/* Playlists Grid */}
        {playlistItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlistItems.map((item) => {
              const playlist = playlists.find(p => p.id === item.id);
              if (!playlist) return null;
              return (
                <SwipeableLibraryItem
                  key={item.id}
                  onDelete={() => handleDeletePlaylist(item.id, item.title)}
                  enabled={isMobile}
                >
                  <PlaylistCard
                    playlist={playlist}
                    onEdit={() => {}}
                    onDelete={() => handleDeletePlaylist(item.id, item.title)}
                  />
                </SwipeableLibraryItem>
              );
            })}
          </div>
        )}

        {/* Owned Tracks Grid */}
        {trackItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trackItems.map((item) => (
              <OwnedTrackCard
                key={item.id}
                track={{
                  id: item.id,
                  title: item.title,
                  audio_url: item.audioData?.audio_url || "",
                  cover_art_url: item.imageUrl || null,
                  duration: item.audioData?.duration || null,
                  price: 0,
                  artist: item.audioData?.artist || null,
                }}
                showAddToQueue={false}
              />
            ))}
          </div>
        )}

        {/* Artists Grid */}
        {artistItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artistItems.map((item) => (
              <Link
                key={item.id}
                to={item.linkTo || "#"}
                className="glass-card p-4 text-center hover:bg-primary/10 transition-all"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 overflow-hidden mb-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                <p className="text-sm text-muted-foreground">Artist</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    if (activeFilter === "albums") {
      return renderAlbumsGrid();
    }

    if (activeFilter === "liked") {
      return renderLikedTracksGrid();
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? `No results for "${searchQuery}"` : "Your library is empty"}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {filteredItems.map((item) => (
          <SwipeableLibraryItem
            key={`${item.type}-${item.id}`}
            onDelete={() => {
              if (item.type === "playlist") {
                handleDeletePlaylist(item.id, item.title);
              }
            }}
            enabled={isMobile && item.type === "playlist"}
          >
            <LibraryListItem
              id={item.id}
              title={item.title}
              subtitle={item.subtitle}
              type={item.type}
              imageUrl={item.imageUrl}
              trackCount={item.trackCount}
              isPinned={item.isPinned}
              isDownloaded={item.isDownloaded}
              isOwned={item.isOwned}
              linkTo={item.linkTo}
              audioData={item.audioData}
            />
          </SwipeableLibraryItem>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onSubmit={handleCreatePlaylist}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-muted/50 overflow-hidden flex-shrink-0">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.display_name || ""} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">Your Library</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCreatePlaylist(true)}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Recently Played Carousel */}
          <RecentlyPlayedCarousel limit={10} showSeeAll={true} />

          {/* Filter Bar */}
          <div className="mb-2">
            <LibraryFilterBar
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              counts={{
                playlists: playlists.length,
                owned: ownedTracks?.length,
                liked: likedTracks?.length,
                artists: followedArtists?.length,
                albums: ownedAlbums?.length,
              }}
            />
          </div>

          {/* Sort Header */}
          <LibrarySortHeader
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Content */}
          {isDataLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : viewMode === "grid" ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </div>
      </PullToRefresh>
    </Layout>
  );
}
