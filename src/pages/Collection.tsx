import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Disc3, Play, Music, Lock, Loader2, Heart, Users, User, ArrowUpDown, ListPlus, ListMusic, Plus, PlayCircle, Shuffle, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionStats, useOwnedTracks } from "@/hooks/useCollectionStats";
import { useLikedTracks, useLikes } from "@/hooks/useLikes";
import { useFollowedArtists, useFollow } from "@/hooks/useFollows";
import { usePlaylists } from "@/hooks/usePlaylists";
import { usePlaylistFolders } from "@/hooks/usePlaylistFolders";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatPrice } from "@/lib/formatters";
import { DownloadButton } from "@/components/download/DownloadButton";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { usePurchases } from "@/hooks/usePurchases";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { LibraryFilterBar, LibraryFilter } from "@/components/library/LibraryFilterBar";
import { RecentlyPlayedCarousel } from "@/components/library/RecentlyPlayedCarousel";
import { OwnedTrackCard } from "@/components/library/OwnedTrackCard";
import { SwipeableLibraryItem } from "@/components/library/SwipeableLibraryItem";
import { FolderSection } from "@/components/library/FolderSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

type SortOption = "recent" | "title" | "artist" | "price";

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get("filter") as LibraryFilter) || "all";
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedSort, setLikedSort] = useState<SortOption>("recent");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const { user, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCollectionStats(user?.id);
  const { data: ownedTracks, isLoading: tracksLoading } = useOwnedTracks(user?.id);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { data: followedArtists, isLoading: followingLoading } = useFollowedArtists();
  const { playlists, isLoading: playlistsLoading, createPlaylist, deletePlaylist } = usePlaylists();
  const { folders, isLoading: foldersLoading } = usePlaylistFolders();
  
  const { toggleLike } = useLikes();
  const { toggleFollow } = useFollow();
  const { playTrack, addToQueue, clearQueue } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");
  const { isOwned } = usePurchases();
  const { showFeedback } = useFeedbackSafe();

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
      queryClient.invalidateQueries({ queryKey: ["playlist-folders"] }),
    ]);
  }, [queryClient]);

  // Sort liked tracks
  const sortedLikedTracks = useMemo(() => {
    if (!likedTracks) return [];
    const sorted = [...likedTracks];
    switch (likedSort) {
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "artist":
        return sorted.sort((a, b) => 
          (a.artist?.display_name || "").localeCompare(b.artist?.display_name || "")
        );
      case "price":
        return sorted.sort((a, b) => b.price - a.price);
      case "recent":
      default:
        return sorted;
    }
  }, [likedTracks, likedSort]);

  // Filter content based on search query
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery) return playlists;
    const query = searchQuery.toLowerCase();
    return playlists.filter(p => p.name.toLowerCase().includes(query));
  }, [playlists, searchQuery]);

  const filteredOwnedTracks = useMemo(() => {
    if (!ownedTracks) return [];
    if (!searchQuery) return ownedTracks;
    const query = searchQuery.toLowerCase();
    return ownedTracks.filter(p => 
      p.track?.title.toLowerCase().includes(query) ||
      p.track?.artist?.display_name?.toLowerCase().includes(query)
    );
  }, [ownedTracks, searchQuery]);

  const filteredLikedTracks = useMemo(() => {
    if (!searchQuery) return sortedLikedTracks;
    const query = searchQuery.toLowerCase();
    return sortedLikedTracks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.artist?.display_name?.toLowerCase().includes(query)
    );
  }, [sortedLikedTracks, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (!followedArtists) return [];
    if (!searchQuery) return followedArtists;
    const query = searchQuery.toLowerCase();
    return followedArtists.filter(a => 
      a.display_name?.toLowerCase().includes(query) ||
      a.bio?.toLowerCase().includes(query)
    );
  }, [followedArtists, searchQuery]);

  // Group playlists by folder
  const playlistsByFolder = useMemo(() => {
    const grouped: Record<string, typeof playlists> = { unfiled: [] };
    folders.forEach(f => { grouped[f.id] = []; });
    
    filteredPlaylists.forEach(playlist => {
      const folderId = (playlist as any).folder_id;
      if (folderId && grouped[folderId]) {
        grouped[folderId].push(playlist);
      } else {
        grouped.unfiled.push(playlist);
      }
    });
    
    return grouped;
  }, [filteredPlaylists, folders]);

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

  const isDataLoading = statsLoading || tracksLoading;

  const handlePlayTrack = async (track: NonNullable<typeof likedTracks>[number]) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
    
    playTrack({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      artist: track.artist,
    });
  };

  const handleAddToQueue = (track: NonNullable<typeof likedTracks>[number]) => {
    if (!canUseFeature("addToQueue")) {
      setPremiumFeatureName("Add to Queue");
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
  };

  const handlePlayAllOwned = async () => {
    if (!ownedTracks || ownedTracks.length === 0) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
    
    clearQueue();
    const firstTrack = ownedTracks[0];
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
    ownedTracks.slice(1).forEach((purchase) => {
      if (purchase.track) {
        addToQueue({
          id: purchase.track.id,
          title: purchase.track.title,
          audio_url: purchase.track.audio_url,
          cover_art_url: purchase.track.cover_art_url,
          duration: purchase.track.duration,
          artist: purchase.track.artist,
        });
      }
    });
    showFeedback({
      type: "success",
      title: "Now Playing",
      message: `Playing ${ownedTracks.length} owned tracks`,
    });
  };

  const handleShuffleOwned = async () => {
    if (!ownedTracks || ownedTracks.length === 0) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
    
    clearQueue();
    const shuffled = [...ownedTracks].sort(() => Math.random() - 0.5);
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
    shuffled.slice(1).forEach((purchase) => {
      if (purchase.track) {
        addToQueue({
          id: purchase.track.id,
          title: purchase.track.title,
          audio_url: purchase.track.audio_url,
          cover_art_url: purchase.track.cover_art_url,
          duration: purchase.track.duration,
          artist: purchase.track.artist,
        });
      }
    });
    showFeedback({
      type: "success",
      title: "Shuffle Play",
      message: `Playing ${ownedTracks.length} tracks shuffled`,
    });
  };

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

  const SortSelect = ({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) => {
    if (!canUseFeature("sorting")) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs glass border-glass-border/30 relative"
          onClick={() => {
            setPremiumFeatureName("Collection sorting");
            setShowPremiumModal(true);
          }}
        >
          <ArrowUpDown className="w-3 h-3 mr-1" />
          Sort
          <Lock className="h-2 w-2 ml-1 text-primary" />
        </Button>
      );
    }
    
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs glass border-glass-border/30">
          <ArrowUpDown className="w-3 h-3 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass">
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="artist">Artist</SelectItem>
          <SelectItem value="price">Price</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  // Render content based on active filter
  const renderContent = () => {
    switch (activeFilter) {
      case "playlists":
        return renderPlaylists();
      case "owned":
        return renderOwnedTracks();
      case "liked":
        return renderLikedTracks();
      case "artists":
        return renderFollowing();
      default:
        return renderAll();
    }
  };

  const renderPlaylists = () => (
    <>
      {playlistsLoading || foldersLoading ? (
        <div className="glass-card p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div>
          {/* Create Playlist Button */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground text-sm">
              {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? "s" : ""}
            </p>
            <Button
              onClick={() => setShowCreatePlaylist(true)}
              className="gradient-accent neon-glow-subtle"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {/* Folders */}
          {folders.map((folder) => (
            <FolderSection
              key={folder.id}
              folder={folder}
              playlists={playlistsByFolder[folder.id] || []}
              onDeletePlaylist={handleDeletePlaylist}
            />
          ))}

          {/* Unfiled Playlists */}
          {playlistsByFolder.unfiled.length > 0 && (
            <div>
              {folders.length > 0 && (
                <h3 className="font-medium text-foreground mb-3">Other Playlists</h3>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {playlistsByFolder.unfiled.map((playlist) => (
                  <SwipeableLibraryItem
                    key={playlist.id}
                    onDelete={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    enabled={isMobile}
                  >
                    <PlaylistCard
                      playlist={playlist}
                      onEdit={() => {}}
                      onDelete={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    />
                  </SwipeableLibraryItem>
                ))}
              </div>
            </div>
          )}

          {filteredPlaylists.length === 0 && (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-6">
                <ListMusic className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {searchQuery ? "No playlists found" : "No playlists yet"}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? `No playlists match "${searchQuery}"`
                  : "Create your first playlist to organize your music."
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="gradient-accent neon-glow-subtle"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Playlist
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderOwnedTracks = () => (
    <>
      {tracksLoading ? (
        <div className="glass-card p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredOwnedTracks.length > 0 ? (
        <div>
          {/* Owned Hero Section */}
          <div className="glass-card-bordered p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-transparent" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Your Music Collection</h2>
                <p className="text-muted-foreground">
                  {filteredOwnedTracks.length} track{filteredOwnedTracks.length !== 1 ? "s" : ""} owned forever
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePlayAllOwned}
                  className="gradient-accent neon-glow-subtle"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Play All
                </Button>
                <Button variant="outline" onClick={handleShuffleOwned}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Shuffle
                </Button>
              </div>
            </div>
          </div>

          {/* Owned Tracks Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredOwnedTracks.map((purchase) => 
              purchase.track && (
                  <OwnedTrackCard
                  key={purchase.id}
                  track={{
                    id: purchase.track.id,
                    title: purchase.track.title,
                    audio_url: purchase.track.audio_url,
                    cover_art_url: purchase.track.cover_art_url,
                    duration: purchase.track.duration,
                    price: (purchase.track as any).price || 0,
                    artist: purchase.track.artist,
                  }}
                  onAddToQueue={() => {
                    if (!canUseFeature("addToQueue")) {
                      setPremiumFeatureName("Add to Queue");
                      setShowPremiumModal(true);
                      return;
                    }
                    addToQueue({
                      id: purchase.track!.id,
                      title: purchase.track!.title,
                      audio_url: purchase.track!.audio_url,
                      cover_art_url: purchase.track!.cover_art_url,
                      duration: purchase.track!.duration,
                      artist: purchase.track!.artist,
                    });
                  }}
                />
              )
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Disc3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? "No tracks found" : "No owned tracks yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? `No owned tracks match "${searchQuery}"`
              : "Purchase tracks to build your permanent collection!"
            }
          </p>
          {!searchQuery && (
            <Button variant="outline" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );

  const renderLikedTracks = () => (
    <>
      {likedLoading ? (
        <div className="glass-card p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredLikedTracks.length > 0 ? (
        <div>
          <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide ios-scroll">
              <Button
                onClick={() => {
                  if (filteredLikedTracks.length > 0) {
                    clearQueue();
                    handlePlayTrack(filteredLikedTracks[0]);
                    filteredLikedTracks.slice(1).forEach((track) => {
                      addToQueue({
                        id: track.id,
                        title: track.title,
                        audio_url: track.audio_url,
                        cover_art_url: track.cover_art_url,
                        duration: track.duration,
                        artist: track.artist,
                      });
                    });
                    showFeedback({
                      type: "success",
                      title: "Now Playing",
                      message: `Playing ${filteredLikedTracks.length} liked tracks`,
                    });
                  }
                }}
                className="gradient-accent neon-glow-subtle whitespace-nowrap flex-shrink-0"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Play All
              </Button>
              <Button
                variant="outline"
                className="whitespace-nowrap flex-shrink-0"
                onClick={() => {
                  if (filteredLikedTracks.length > 0) {
                    clearQueue();
                    const shuffled = [...filteredLikedTracks].sort(() => Math.random() - 0.5);
                    handlePlayTrack(shuffled[0]);
                    shuffled.slice(1).forEach((track) => {
                      addToQueue({
                        id: track.id,
                        title: track.title,
                        audio_url: track.audio_url,
                        cover_art_url: track.cover_art_url,
                        duration: track.duration,
                        artist: track.artist,
                      });
                    });
                    showFeedback({
                      type: "success",
                      title: "Shuffle Play",
                      message: `Playing ${filteredLikedTracks.length} tracks shuffled`,
                    });
                  }
                }}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle
              </Button>
            </div>
            <SortSelect value={likedSort} onChange={setLikedSort} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredLikedTracks.map((track) => (
              <div
                key={track.id}
                className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                onClick={() => handlePlayTrack(track)}
              >
                <div className={`aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden ${isOwned(track.id) ? 'owned-track-ring' : ''}`}>
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
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="icon" className="rounded-full gradient-accent neon-glow w-10 h-10">
                      <Play className="w-4 h-4 ml-0.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToQueue(track);
                      }}
                      title={canUseFeature("addToQueue") ? "Add to queue" : "Premium feature"}
                    >
                      <ListPlus className="w-4 h-4" />
                      {!canUseFeature("addToQueue") && (
                        <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />
                      )}
                    </Button>
                    {isOwned(track.id) && (
                      <DownloadButton
                        track={{
                          id: track.id,
                          title: track.title,
                          cover_art_url: track.cover_art_url,
                          price: track.price,
                          audio_url: track.audio_url || "",
                          artist: track.artist ? { display_name: track.artist.display_name } : undefined,
                        }}
                        variant="outline"
                        size="icon"
                        className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50"
                      />
                    )}
                  </div>
                  {isOwned(track.id) && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-xs font-medium text-primary-foreground animate-pulse">
                      OWNED
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                  <Link
                    to={`/artist/${track.artist?.id}`}
                    className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {track.artist?.display_name || "Unknown Artist"}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-primary">{formatPrice(track.price)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track.id);
                      }}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? "No tracks found" : "No liked tracks yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? `No liked tracks match "${searchQuery}"`
              : "Explore and like tracks to build your collection!"
            }
          </p>
          {!searchQuery && (
            <Button variant="outline" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );

  const renderFollowing = () => (
    <>
      {followingLoading ? (
        <div className="glass-card p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredArtists.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredArtists.map((artist) => (
            <Link
              key={artist.id}
              to={artist.role === 'label' ? `/label/${artist.id}` : `/artist/${artist.id}`}
              className="glass-card p-4 group hover:bg-primary/10 transition-all duration-300"
            >
              <div className="aspect-square rounded-full bg-muted/50 mb-4 relative overflow-hidden mx-auto w-24 h-24 sm:w-32 sm:h-32">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.display_name || "Artist"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {artist.display_name || "Unknown"}
                  </h3>
                  {artist.role && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {artist.role === 'label' && <Building2 className="w-3 h-3 mr-1" />}
                      {artist.role === 'artist' && <Music className="w-3 h-3 mr-1" />}
                      {artist.role}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFollow(artist.id);
                  }}
                >
                  Unfollow
                </Button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? "No artists found" : "Not following anyone yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? `No followed artists match "${searchQuery}"`
              : "Discover and follow artists to stay updated!"
            }
          </p>
          {!searchQuery && (
            <Button variant="outline" asChild>
              <Link to="/artists">Discover Artists</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );

  const renderAll = () => (
    <div className="space-y-8">
      {/* Recently Played Carousel */}
      <RecentlyPlayedCarousel />

      {/* Playlists Section */}
      {filteredPlaylists.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-primary" />
              Playlists
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange("playlists")}
              className="text-muted-foreground hover:text-primary"
            >
              See All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPlaylists.slice(0, 5).map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onEdit={() => {}}
                onDelete={() => handleDeletePlaylist(playlist.id, playlist.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Owned Tracks Section */}
      {filteredOwnedTracks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-primary" />
              Owned Tracks
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange("owned")}
              className="text-muted-foreground hover:text-primary"
            >
              See All ({filteredOwnedTracks.length})
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredOwnedTracks.slice(0, 5).map((purchase) => 
              purchase.track && (
              <OwnedTrackCard
                  key={purchase.id}
                  track={{
                    id: purchase.track.id,
                    title: purchase.track.title,
                    audio_url: purchase.track.audio_url,
                    cover_art_url: purchase.track.cover_art_url,
                    duration: purchase.track.duration,
                    price: (purchase.track as any).price || 0,
                    artist: purchase.track.artist,
                  }}
                  showAddToQueue={false}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* Liked Tracks Section */}
      {filteredLikedTracks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Liked Tracks
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange("liked")}
              className="text-muted-foreground hover:text-primary"
            >
              See All ({filteredLikedTracks.length})
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredLikedTracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
                  {track.cover_art_url ? (
                    <img
                      src={track.cover_art_url}
                      alt={track.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-medium text-sm text-foreground truncate">{track.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist?.display_name || "Unknown Artist"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Following Section */}
      {filteredArtists.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Following
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange("artists")}
              className="text-muted-foreground hover:text-primary"
            >
              See All ({filteredArtists.length})
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide ios-scroll">
            {filteredArtists.slice(0, 8).map((artist) => (
              <Link
                key={artist.id}
                to={artist.role === 'label' ? `/label/${artist.id}` : `/artist/${artist.id}`}
                className="flex-shrink-0 w-28 text-center group"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 overflow-hidden mb-2 group-hover:ring-2 group-hover:ring-primary transition-all">
                  {artist.avatar_url ? (
                    <img
                      src={artist.avatar_url}
                      alt={artist.display_name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground truncate">{artist.display_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPlaylists.length === 0 && 
       filteredOwnedTracks.length === 0 && 
       filteredLikedTracks.length === 0 && 
       filteredArtists.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? "No results found" : "Your library is empty"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? `Nothing matches "${searchQuery}"`
              : "Start exploring to build your music collection!"
            }
          </p>
          {!searchQuery && (
            <Button variant="outline" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature={premiumFeatureName}
      />
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onSubmit={handleCreatePlaylist}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
              {profile?.display_name ? `${profile.display_name}'s Library` : "My Library"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Your playlists and music collection</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="glass-card p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">
                {isDataLoading ? <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin mx-auto" /> : stats?.tracksOwned ?? 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Tracks Owned</div>
            </div>
            <div className="glass-card p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">
                {playlistsLoading ? <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin mx-auto" /> : playlists.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Playlists</div>
            </div>
            <div className="glass-card p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">
                {isDataLoading ? <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin mx-auto" /> : followedArtists?.length ?? 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
            </div>
            <div className="glass-card p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">
                {isDataLoading ? (
                  <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin mx-auto" />
                ) : (
                  formatPrice(stats?.totalSpent ?? 0)
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">USD Spent</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6">
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
              }}
            />
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </PullToRefresh>
    </Layout>
  );
}
