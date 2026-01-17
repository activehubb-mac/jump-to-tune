import { useState, useMemo } from "react";
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
import { Disc3, Play, Music, Lock, Loader2, Heart, Users, User, ArrowUpDown, ListPlus, Bookmark, X, Download, Crown, Building2, PlayCircle, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionStats, useOwnedTracks } from "@/hooks/useCollectionStats";
import { useLikedTracks, useLikes } from "@/hooks/useLikes";
import { useFollowedArtists, useFollow } from "@/hooks/useFollows";
import { useCollectionBookmarks } from "@/hooks/useCollectionBookmarks";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatPrice } from "@/lib/formatters";
import { DownloadButton } from "@/components/download/DownloadButton";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { usePurchases } from "@/hooks/usePurchases";

type SortOption = "recent" | "title" | "artist" | "price";

export default function Collection() {
  const [activeTab, setActiveTab] = useState("liked");
  const [likedSort, setLikedSort] = useState<SortOption>("recent");
  const [ownedSort, setOwnedSort] = useState<SortOption>("recent");
  const [bookmarkedSort, setBookmarkedSort] = useState<SortOption>("recent");
  const { user, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCollectionStats(user?.id);
  const { data: ownedTracks, isLoading: tracksLoading } = useOwnedTracks(user?.id);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { data: followedArtists, isLoading: followingLoading } = useFollowedArtists();
  const { bookmarks, isLoading: bookmarksLoading, removeBookmark } = useCollectionBookmarks();
  const { toggleLike } = useLikes();
  const { toggleFollow } = useFollow();
  const { playTrack, addToQueue, clearQueue } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");
  const { isOwned } = usePurchases();

  // Sort liked tracks - must be called before any early returns
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
        return sorted; // Already sorted by most recent from hook
    }
  }, [likedTracks, likedSort]);

  // Sort owned tracks - must be called before any early returns
  const sortedOwnedTracks = useMemo(() => {
    if (!ownedTracks) return [];
    const sorted = [...ownedTracks];
    switch (ownedSort) {
      case "title":
        return sorted.sort((a, b) => 
          (a.track?.title || "").localeCompare(b.track?.title || "")
        );
      case "artist":
        return sorted.sort((a, b) => 
          (a.track?.artist?.display_name || "").localeCompare(b.track?.artist?.display_name || "")
        );
      case "price":
        return sorted.sort((a, b) => (b.price_paid || 0) - (a.price_paid || 0));
      case "recent":
      default:
        return sorted; // Already sorted by most recent from hook
    }
  }, [ownedTracks, ownedSort]);

  // Sort bookmarked tracks - must be called before any early returns
  const sortedBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    const sorted = [...bookmarks];
    switch (bookmarkedSort) {
      case "title":
        return sorted.sort((a, b) => 
          (a.track?.title || "").localeCompare(b.track?.title || "")
        );
      case "artist":
        return sorted.sort((a, b) => 
          (a.track?.artist?.display_name || "").localeCompare(b.track?.artist?.display_name || "")
        );
      case "price":
        return sorted.sort((a, b) => (b.track?.price || 0) - (a.track?.price || 0));
      case "recent":
      default:
        return sorted; // Already sorted by most recent from hook
    }
  }, [bookmarks, bookmarkedSort]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Not logged in - show sign in prompt
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
              Sign in to view your music collection and manage your owned tracks.
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {profile?.display_name ? `${profile.display_name}'s Collection` : "My Collection"}
          </h1>
          <p className="text-muted-foreground">Your owned tracks and music collection</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats?.tracksOwned ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Tracks Owned</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : likedTracks?.length ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Liked Tracks</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : followedArtists?.length ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                formatPrice(stats?.totalSpent ?? 0)
              )}
            </div>
            <div className="text-sm text-muted-foreground">USD Spent</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-8">
            <TabsTrigger value="liked" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Liked</span>
              {likedTracks && likedTracks.length > 0 && (
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {likedTracks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="bookmarked" 
              className="flex items-center gap-2"
              disabled={!canUseFeature("bookmark")}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Bookmarked</span>
              {!canUseFeature("bookmark") && <Lock className="w-3 h-3 text-primary" />}
              {bookmarks && bookmarks.length > 0 && (
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {bookmarks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="owned" className="flex items-center gap-2">
              <Disc3 className="w-4 h-4" />
              <span className="hidden sm:inline">Owned</span>
              {ownedTracks && ownedTracks.length > 0 && (
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {ownedTracks.length}
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

          {/* Liked Tracks Tab */}
          <TabsContent value="liked">
            {likedLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedLikedTracks.length > 0 ? (
              <div>
                <div className="flex justify-end mb-4">
                  <SortSelect value={likedSort} onChange={setLikedSort} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedLikedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                    onClick={() => handlePlayTrack(track)}
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
                      </div>
                      {/* Unlike Button */}
                      <button
                        className="absolute top-2 right-2 p-2 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                      >
                        <Heart className="w-4 h-4 text-primary fill-primary" />
                      </button>
                    </div>

                    {/* Track Info */}
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
                        <span className="text-sm font-medium text-primary">
                          {formatPrice(track.price)}
                        </span>
                        {isOwned(track.id) ? (
                          <Badge variant="secondary" className="text-xs">
                            <Disc3 className="w-3 h-3 mr-1" />
                            Owned
                          </Badge>
                        ) : (
                          <DownloadButton
                            track={{
                              id: track.id,
                              title: track.title,
                              price: track.price,
                              audio_url: track.audio_url,
                              cover_art_url: track.cover_art_url,
                              artist: track.artist,
                            }}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          />
                        )}
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
                  Browse music and click the heart to save your favorites!
                </p>
                <Button variant="outline" asChild>
                  <Link to="/browse">Browse Music</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookmarked Tracks Tab */}
          <TabsContent value="bookmarked">
            {bookmarksLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedBookmarks.length > 0 ? (
              <div>
                <div className="flex justify-end mb-4">
                  <SortSelect value={bookmarkedSort} onChange={setBookmarkedSort} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {sortedBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                      onClick={() => {
                        if (bookmark.track) {
                          playTrack({
                            id: bookmark.track.id,
                            title: bookmark.track.title,
                            audio_url: bookmark.track.audio_url,
                            cover_art_url: bookmark.track.cover_art_url,
                            duration: bookmark.track.duration,
                            artist: bookmark.track.artist,
                          });
                        }
                      }}
                    >
                      {/* Album Art */}
                      <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
                        {bookmark.track?.cover_art_url ? (
                          <img
                            src={bookmark.track.cover_art_url}
                            alt={bookmark.track.title}
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
                            className="rounded-full w-10 h-10 border-glass-border/50 hover:border-primary/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (bookmark.track) {
                                addToQueue({
                                  id: bookmark.track.id,
                                  title: bookmark.track.title,
                                  audio_url: bookmark.track.audio_url,
                                  cover_art_url: bookmark.track.cover_art_url,
                                  duration: bookmark.track.duration,
                                  artist: bookmark.track.artist,
                                });
                              }
                            }}
                            title="Add to queue"
                          >
                            <ListPlus className="w-4 h-4" />
                          </Button>
                        </div>
                        {/* Remove Bookmark Button */}
                        <button
                          className="absolute top-2 right-2 p-2 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(bookmark.track_id);
                          }}
                          title="Remove from bookmarks"
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>

                      {/* Track Info */}
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{bookmark.track?.title}</h3>
                        <Link
                          to={`/artist/${bookmark.track?.artist?.id}`}
                          className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {bookmark.track?.artist?.display_name || "Unknown Artist"}
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-primary">
                            {formatPrice(bookmark.track?.price || 0)}
                          </span>
                          {bookmark.track && (
                            isOwned(bookmark.track.id) ? (
                              <Badge variant="secondary" className="text-xs">
                                <Disc3 className="w-3 h-3 mr-1" />
                                Owned
                              </Badge>
                            ) : (
                              <DownloadButton
                                track={{
                                  id: bookmark.track.id,
                                  title: bookmark.track.title,
                                  price: bookmark.track.price,
                                  audio_url: bookmark.track.audio_url,
                                  cover_art_url: bookmark.track.cover_art_url,
                                  artist: bookmark.track.artist,
                                }}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Bookmark className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No bookmarked tracks</h2>
                <p className="text-muted-foreground mb-6">
                  Bookmark tracks to save them for streaming later!
                </p>
                <Button variant="outline" asChild>
                  <Link to="/browse">Browse Music</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="owned">
            {tracksLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedOwnedTracks.length > 0 ? (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        if (sortedOwnedTracks.length > 0) {
                          clearQueue();
                          const firstTrack = sortedOwnedTracks[0];
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
                          sortedOwnedTracks.slice(1).forEach((purchase) => {
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
                        }
                      }}
                      className="gradient-accent neon-glow-subtle"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Play All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (sortedOwnedTracks.length > 0) {
                          clearQueue();
                          const shuffled = [...sortedOwnedTracks].sort(() => Math.random() - 0.5);
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
                        }
                      }}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        sortedOwnedTracks.forEach((purchase) => {
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
                      }}
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Queue All
                    </Button>
                  </div>
                  <SortSelect value={ownedSort} onChange={setOwnedSort} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedOwnedTracks.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                    onClick={() => {
                      if (purchase.track) {
                        playTrack({
                          id: purchase.track.id,
                          title: purchase.track.title,
                          audio_url: purchase.track.audio_url,
                          cover_art_url: purchase.track.cover_art_url,
                          duration: purchase.track.duration,
                          artist: purchase.track.artist,
                        });
                      }
                    }}
                  >
                    {/* Album Art */}
                    <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
                      {purchase.track?.cover_art_url ? (
                        <img
                          src={purchase.track.cover_art_url}
                          alt={purchase.track.title}
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
                            if (purchase.track) {
                              playTrack({
                                id: purchase.track.id,
                                title: purchase.track.title,
                                audio_url: purchase.track.audio_url,
                                cover_art_url: purchase.track.cover_art_url,
                                duration: purchase.track.duration,
                                artist: purchase.track.artist,
                              });
                            }
                          }}
                        >
                          <Play className="w-5 h-5 ml-0.5" />
                        </Button>
                      </div>
                      {/* Edition Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-xs font-medium text-primary-foreground">
                        #{purchase.edition_number}
                      </div>
                    </div>

                    {/* Track Info */}
                    <div>
                      <h3 className="font-semibold text-foreground truncate">{purchase.track?.title}</h3>
                      <Link
                        to={`/artist/${purchase.track?.artist?.id}`}
                        className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block"
                      >
                        {purchase.track?.artist?.display_name || "Unknown Artist"}
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium text-primary">
                          {formatPrice(purchase.price_paid)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          of {purchase.track?.total_editions}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-6">
                  <Music className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Your collection is empty</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start building your collection by browsing and purchasing tracks from talented artists.
                </p>
                <Button className="gradient-accent neon-glow-subtle hover:neon-glow" asChild>
                  <Link to="/browse">
                    <Disc3 className="w-4 h-4 mr-2" />
                    Browse Music
                  </Link>
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
                    {/* Avatar */}
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

                    {/* Artist Info */}
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
    </Layout>
  );
}
