import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLibraryItems, LibraryFilterOption, LibrarySortOption } from "@/hooks/useLibraryItems";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { LibraryHeader } from "@/components/library/LibraryHeader";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
import { LibrarySortMenu } from "@/components/library/LibrarySortMenu";
import { LibraryListItem } from "@/components/library/LibraryListItem";
import { LibraryGridItem } from "@/components/library/LibraryGridItem";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Collection() {
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get("filter") as LibraryFilterOption) || "all";
  
  const [activeFilter, setActiveFilter] = useState<LibraryFilterOption>(initialFilter);
  const [sortOption, setSortOption] = useState<LibrarySortOption>("recents");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  
  const queryClient = useQueryClient();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { libraryItems, isLoading: itemsLoading } = useLibraryItems(activeFilter, sortOption);
  const { createPlaylist } = usePlaylists();
  const { showFeedback } = useFeedbackSafe();

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

  return (
    <Layout useBackground="subtle">
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onSubmit={handleCreatePlaylist}
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

          {/* Filter Chips */}
          <div className="mb-4">
            <LibraryFilterChips
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
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
                  <LibraryListItem key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <LibraryGridItem key={`${item.type}-${item.id}`} item={item} />
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
        </div>
      </PullToRefresh>
    </Layout>
  );
}
