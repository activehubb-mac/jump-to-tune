import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Disc3, Play, Music, Lock, Loader2, Heart, Users, User, ArrowUpDown, ListPlus, ListMusic, Plus, PlayCircle, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionStats, useOwnedTracks } from "@/hooks/useCollectionStats";
import { useLikedTracks, useLikes } from "@/hooks/useLikes";
import { useFollowedArtists, useFollow } from "@/hooks/useFollows";
import { usePlaylists } from "@/hooks/usePlaylists";
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
import { Building2 } from "lucide-react";

type SortOption = "recent" | "title" | "artist" | "price";

export default function Collection() {
  const [activeTab, setActiveTab] = useState("playlists");
  const [likedSort, setLikedSort] = useState<SortOption>("recent");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const queryClient = useQueryClient();
  
  const { user, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCollectionStats(user?.id);
  const { data: ownedTracks, isLoading: tracksLoading } = useOwnedTracks(user?.id);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { data: followedArtists, isLoading: followingLoading } = useFollowedArtists();
  const { playlists, isLoading: playlistsLoading, createPlaylist, deletePlaylist } = usePlaylists();
  
  const { toggleLike } = useLikes();
  const { toggleFollow } = useFollow();
  const { playTrack, addToQueue, clearQueue } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");
  const { isOwned } = usePurchases();
  const { showFeedback } = useFeedbackSafe();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["collection-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["owned-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["liked-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["followed-artists"] }),
      queryClient.invalidateQueries({ queryKey: ["playlists"] }),
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

  const handlePlayTrack = (track: NonNullable<typeof likedTracks>[number]) => {
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

  const handlePlayAllOwned = () => {
    if (!ownedTracks || ownedTracks.length === 0) return;
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

  const handleShuffleOwned = () => {
    if (!ownedTracks || ownedTracks.length === 0) return;
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
            {profile?.display_name ? `${profile.display_name}'s Library` : "My Library"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your playlists and music collection</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md sm:max-w-2xl grid-cols-3 mb-6 sm:mb-8">
            <TabsTrigger value="playlists" className="flex items-center gap-2">
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">Playlists</span>
              {playlists.length > 0 && (
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {playlists.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Liked</span>
              {likedTracks && likedTracks.length > 0 && (
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {likedTracks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Following</span>
              {followedArtists && followedArtists.length > 0 && (
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {followedArtists.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Playlists Tab */}
          <TabsContent value="playlists">
            {playlistsLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                {/* Create Playlist Button */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-muted-foreground text-sm">
                    Create playlists from your {ownedTracks?.length || 0} owned track{(ownedTracks?.length || 0) !== 1 ? "s" : ""}
                  </p>
                  <Button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="gradient-accent neon-glow-subtle"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist
                  </Button>
                </div>

                {/* User Playlists */}
                {playlists.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {playlists.map((playlist) => (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onEdit={() => {}} // Navigate to detail for editing
                        onDelete={() => handleDeletePlaylist(playlist.id, playlist.name)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-6">
                      <ListMusic className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">No playlists yet</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      {(ownedTracks?.length || 0) > 0 
                        ? `Create your first playlist to organize your ${ownedTracks?.length} owned tracks.`
                        : "Purchase some tracks first, then create playlists to organize them."
                      }
                    </p>
                    <Button
                      onClick={() => setShowCreatePlaylist(true)}
                      className="gradient-accent neon-glow-subtle"
                      disabled={(ownedTracks?.length || 0) === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Playlist
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Liked Tracks Tab */}
          <TabsContent value="liked">
            {likedLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedLikedTracks.length > 0 ? (
              <div>
                <div className="flex justify-between items-center gap-3 mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                      onClick={() => {
                        if (sortedLikedTracks.length > 0) {
                          clearQueue();
                          const firstTrack = sortedLikedTracks[0];
                          playTrack({
                            id: firstTrack.id,
                            title: firstTrack.title,
                            audio_url: firstTrack.audio_url,
                            cover_art_url: firstTrack.cover_art_url,
                            duration: firstTrack.duration,
                            artist: firstTrack.artist,
                          });
                          sortedLikedTracks.slice(1).forEach((track) => {
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
                            message: `Playing ${sortedLikedTracks.length} liked tracks`,
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
                        if (sortedLikedTracks.length > 0) {
                          clearQueue();
                          const shuffled = [...sortedLikedTracks].sort(() => Math.random() - 0.5);
                          const firstTrack = shuffled[0];
                          playTrack({
                            id: firstTrack.id,
                            title: firstTrack.title,
                            audio_url: firstTrack.audio_url,
                            cover_art_url: firstTrack.cover_art_url,
                            duration: firstTrack.duration,
                            artist: firstTrack.artist,
                          });
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
                            message: `Playing ${sortedLikedTracks.length} tracks shuffled`,
                          });
                        }
                      }}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle
                    </Button>
                    <Button
                      variant="secondary"
                      className="whitespace-nowrap flex-shrink-0"
                      onClick={() => {
                        sortedLikedTracks.forEach((track) => {
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
                          title: "Added to Queue",
                          message: `${sortedLikedTracks.length} liked tracks added to queue`,
                        });
                      }}
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Queue All
                    </Button>
                  </div>
                  <SortSelect value={likedSort} onChange={setLikedSort} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedLikedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                    onClick={() => handlePlayTrack(track)}
                  >
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
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-xs font-medium text-primary-foreground">
                          Owned
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
                <h2 className="text-xl font-semibold text-foreground mb-2">No liked tracks yet</h2>
                <p className="text-muted-foreground mb-6">
                  Explore and like tracks to build your collection!
                </p>
                <Button variant="outline" asChild>
                  <Link to="/browse">Browse Music</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following">
            {followingLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : followedArtists && followedArtists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {followedArtists.map((artist) => (
                  <Link
                    key={artist.id}
                    to={artist.role === 'label' ? `/label/${artist.id}` : `/artist/${artist.id}`}
                    className="glass-card p-4 group hover:bg-primary/10 transition-all duration-300"
                  >
                    <div className="aspect-square rounded-full bg-muted/50 mb-4 relative overflow-hidden mx-auto w-32 h-32">
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
                      <div className="flex items-center justify-center gap-2 mb-1">
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
                      {artist.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {artist.bio}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
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
                <h2 className="text-xl font-semibold text-foreground mb-2">Not following anyone yet</h2>
                <p className="text-muted-foreground mb-6">
                  Discover and follow artists to stay updated with their latest releases!
                </p>
                <Button variant="outline" asChild>
                  <Link to="/artists">Discover Artists</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
