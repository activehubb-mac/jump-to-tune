import { useState, useMemo, useCallback, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Plus, FolderPlus } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLibraryItems, LibraryFilterOption, LibrarySortOption } from "@/hooks/useLibraryItems";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useFollow } from "@/hooks/useFollows";
import { usePinnedLibraryItems } from "@/hooks/usePinnedLibraryItems";
import { usePlaylistFolders } from "@/hooks/usePlaylistFolders";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { CreateFolderModal } from "@/components/playlist/CreateFolderModal";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { LibraryHeader } from "@/components/library/LibraryHeader";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
import { LibrarySortMenu } from "@/components/library/LibrarySortMenu";
import { LibraryGridItem } from "@/components/library/LibraryGridItem";
import { SwipeableLibraryItem } from "@/components/library/SwipeableLibraryItem";
import { RecentlyPlayedSection } from "@/components/library/RecentlyPlayedSection";
import { FolderSection } from "@/components/library/FolderSection";
import { PlaylistInvitesSection } from "@/components/library/PlaylistInvitesSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLikedTracks } from "@/hooks/useLikes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Heart, Play, Pause } from "lucide-react";

export default function Collection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filterParam = searchParams.get("filter");
  const showLikedSongs = filterParam === "liked";
  
  const [activeFilter, setActiveFilter] = useState<LibraryFilterOption>("all");
  const [sortOption, setSortOption] = useState<LibrarySortOption>("recents");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { libraryItems, isLoading: itemsLoading } = useLibraryItems(activeFilter, sortOption);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { deletePlaylist } = usePlaylists();
  const { toggleFollow } = useFollow();
  const { togglePin, isPinned } = usePinnedLibraryItems();
  const { showFeedback } = useFeedbackSafe();
  const { createFolder } = usePlaylistFolders();
  const isMobile = useIsMobile();
  const { createPlaylist } = usePlaylists();
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

  // Handle back navigation from liked songs view
  const handleBackToLibrary = () => {
    navigate("/library");
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["collection-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["owned-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["liked-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["followedArtists"] }),
      queryClient.invalidateQueries({ queryKey: ["playlists"] }),
      queryClient.invalidateQueries({ queryKey: ["recent-artists"] }),
      queryClient.invalidateQueries({ queryKey: ["recent-albums"] }),
    ]);
  }, [queryClient]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return libraryItems;
    const query = searchQuery.toLowerCase();
    return libraryItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [libraryItems, searchQuery]);

  const handleCreatePlaylist = async (data: { name: string; description?: string }) => {
    await createPlaylist.mutateAsync(data);
    showFeedback({
      type: "success",
      title: "Playlist created",
      message: `"${data.name}" has been created`,
    });
  };

  const handleCreateFolder = async (data: { name: string; color: string }) => {
    await createFolder.mutateAsync(data);
    showFeedback({
      type: "success",
      title: "Folder created",
      message: `"${data.name}" has been created`,
    });
  };

  const handleDeleteItem = async (item: typeof libraryItems[0]) => {
    try {
      if (item.type === "playlist") {
        await deletePlaylist.mutateAsync(item.id);
        showFeedback({
          type: "success",
          title: "Playlist deleted",
          message: `"${item.title}" has been removed`,
        });
      } else if (item.type === "artist" && item.canDelete) {
        await toggleFollow(item.id, item.title);
        showFeedback({
          type: "success",
          title: "Unfollowed",
          message: `You unfollowed ${item.title}`,
        });
      }
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to complete action",
      });
    }
  };

  const handleTogglePin = (item: typeof libraryItems[0]) => {
    if (item.type === "playlist" || item.type === "artist" || item.type === "album") {
      togglePin(item.id, item.type);
      const wasPinned = isPinned(item.id, item.type);
      showFeedback({
        type: "success",
        title: wasPinned ? "Unpinned" : "Pinned",
        message: wasPinned 
          ? `"${item.title}" removed from pins` 
          : `"${item.title}" pinned to top`,
      });
    }
  };

  const handlePlayTrack = (item: typeof libraryItems[0]) => {
    if (item.type === "track" && item.trackData) {
      const track = item.trackData;
      const isCurrentTrack = currentTrack?.id === track.id;
      
      if (isCurrentTrack) {
        togglePlayPause();
      } else {
        playTrack({
          id: track.id,
          title: track.title,
          audio_url: track.audio_url,
          cover_art_url: track.cover_art_url,
          duration: track.duration,
          price: track.price || 0,
          artist: track.artist ? {
            id: track.artist.id,
            display_name: track.artist.display_name,
          } : undefined,
        });
      }
    }
  };

  if (authLoading) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Library Awaits</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to view your music library and manage your playlists.
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

  // Liked Songs View
  if (showLikedSongs) {
    return (
      <Layout useBackground="subtle">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="container mx-auto px-4 py-6 sm:py-8">
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToLibrary}
                className="shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Liked Songs</h1>
                <p className="text-muted-foreground text-sm">
                  {likedTracks?.length || 0} song{(likedTracks?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Liked Songs Hero */}
            <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-500 flex items-center gap-4">
              <div className="w-20 h-20 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                <Heart className="w-10 h-10 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">Liked Songs</h2>
                <p className="text-white/80 text-sm">
                  {likedTracks?.length || 0} tracks you've liked
                </p>
              </div>
              {likedTracks && likedTracks.length > 0 && (
                <Button
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white text-primary hover:bg-white/90 shadow-lg shrink-0"
                  onClick={() => {
                    const firstTrack = likedTracks[0];
                    if (firstTrack) {
                      playTrack({
                        id: firstTrack.id,
                        title: firstTrack.title,
                        audio_url: firstTrack.audio_url,
                        cover_art_url: firstTrack.cover_art_url,
                        duration: firstTrack.duration,
                        price: firstTrack.price,
                        artist: firstTrack.artist ? {
                          id: firstTrack.artist.id,
                          display_name: firstTrack.artist.display_name,
                        } : undefined,
                      });
                    }
                  }}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </Button>
              )}
            </div>

            {/* Track List */}
            {likedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : likedTracks && likedTracks.length > 0 ? (
              <div className="space-y-1">
                {likedTracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (isCurrentTrack) {
                          togglePlayPause();
                        } else {
                          playTrack({
                            id: track.id,
                            title: track.title,
                            audio_url: track.audio_url,
                            cover_art_url: track.cover_art_url,
                            duration: track.duration,
                            price: track.price,
                            artist: track.artist ? {
                              id: track.artist.id,
                              display_name: track.artist.display_name,
                            } : undefined,
                          });
                        }
                      }}
                    >
                      {/* Track Number / Play indicator */}
                      <div className="w-6 text-center text-sm text-muted-foreground">
                        {isCurrentTrack && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" />
                            <span className="w-0.5 h-4 bg-primary animate-pulse rounded-full delay-100" />
                            <span className="w-0.5 h-2 bg-primary animate-pulse rounded-full delay-200" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden">{index + 1}</span>
                        )}
                        {!isCurrentTrack && (
                          <Play className="w-4 h-4 hidden group-hover:block mx-auto" />
                        )}
                        {isCurrentTrack && !isPlaying && (
                          <Pause className="w-4 h-4 mx-auto" />
                        )}
                      </div>

                      {/* Cover Art */}
                      <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-muted">
                        {track.cover_art_url ? (
                          <img
                            src={track.cover_art_url}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate text-sm ${isCurrentTrack ? "text-primary" : "text-foreground"}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist?.display_name || "Unknown Artist"}
                        </p>
                      </div>

                      {/* Liked indicator */}
                      <Heart className="w-4 h-4 text-primary fill-primary shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-6">
                  <Heart className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">No liked songs yet</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start exploring and like songs to build your collection.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/browse">Browse Music</Link>
                </Button>
              </div>
            )}
          </div>
        </PullToRefresh>
      </Layout>
    );
  }

  return (
    <Layout useBackground="subtle">
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onSubmit={handleCreatePlaylist}
      />
      <CreateFolderModal
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onSubmit={handleCreateFolder}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <LibraryHeader
            title="Your Library"
            onCreatePlaylist={() => setShowCreatePlaylist(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Playlist Invites */}
          <PlaylistInvitesSection />

          {/* Recently Played Section */}
          <RecentlyPlayedSection />

          {/* Folders Section */}
          {activeFilter === "all" || activeFilter === "playlists" ? (
            <FolderSection />
          ) : null}

          {/* Filter Chips */}
          <div className="mb-4 flex items-center gap-2">
            <LibraryFilterChips
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            {activeFilter === "playlists" && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setShowCreateFolder(true)}
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Sort & View Toggle */}
          <div className="flex items-center justify-between mb-4">
            <LibrarySortMenu
              sort={sortOption}
              onSortChange={setSortOption}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Content */}
          {itemsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length > 0 ? (
            viewMode === "list" ? (
              <div className="space-y-1">
                {filteredItems.map((item) => (
                  isMobile && (item.canDelete || item.canPin) ? (
                    <SwipeableLibraryItem
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onDelete={item.canDelete ? () => handleDeleteItem(item) : undefined}
                      onTogglePin={item.canPin ? () => handleTogglePin(item) : undefined}
                      onItemClick={item.type === "track" ? () => handlePlayTrack(item) : undefined}
                      isPinned={item.isPinned}
                      canDelete={item.canDelete}
                      canPin={item.canPin}
                    />
                  ) : (
                    <div 
                      key={`${item.type}-${item.id}`}
                      className="group relative"
                      onContextMenu={(e) => {
                        if (item.canPin) {
                          e.preventDefault();
                          handleTogglePin(item);
                        }
                      }}
                    >
                      <SwipeableLibraryItem
                        item={item}
                        onItemClick={item.type === "track" ? () => handlePlayTrack(item) : undefined}
                        canDelete={false}
                        canPin={false}
                      />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <LibraryGridItem 
                    key={`${item.type}-${item.id}`} 
                    item={item} 
                    onClick={item.type === "track" ? () => handlePlayTrack(item) : undefined}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {searchQuery ? "No results found" : "Your library is empty"}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : "Start building your library by discovering music, creating playlists, and following artists."}
              </p>
              {!searchQuery && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="gradient-accent neon-glow-subtle"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/browse">Browse Music</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Mobile swipe hint */}
          {isMobile && filteredItems.length > 0 && viewMode === "list" && (
            <p className="text-xs text-muted-foreground text-center mt-6">
              Swipe left on items to pin or remove
            </p>
          )}
        </div>
      </PullToRefresh>
    </Layout>
  );
}