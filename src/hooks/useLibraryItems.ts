import { useMemo } from "react";
import { usePlaylists, Playlist } from "@/hooks/usePlaylists";
import { useOwnedTracks } from "@/hooks/useCollectionStats";
import { useLikedTracks } from "@/hooks/useLikes";
import { useFollowedArtists } from "@/hooks/useFollows";
import { useRecentArtists } from "@/hooks/useRecentArtists";
import { useRecentAlbums } from "@/hooks/useRecentAlbums";
import { useAuth } from "@/contexts/AuthContext";

export type LibraryItemType = "playlist" | "album" | "artist" | "track" | "liked-songs";
export type LibrarySortOption = "recents" | "recently-added" | "alphabetical";
export type LibraryFilterOption = "all" | "playlists" | "albums" | "artists" | "downloaded";

export interface LibraryItem {
  id: string;
  type: LibraryItemType;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  imageShape: "square" | "rounded";
  isPinned?: boolean;
  isDownloaded?: boolean;
  lastInteractedAt: number;
  trackCount?: number;
  // Additional data for navigation
  linkTo: string;
}

export function useLibraryItems(filter: LibraryFilterOption = "all", sort: LibrarySortOption = "recents") {
  const { user } = useAuth();
  const { playlists, isLoading: playlistsLoading } = usePlaylists();
  const { data: ownedTracks, isLoading: ownedLoading } = useOwnedTracks(user?.id);
  const { data: likedTracks, isLoading: likedLoading } = useLikedTracks();
  const { data: followedArtists, isLoading: followedLoading } = useFollowedArtists();
  const { recentArtists, isLoading: recentArtistsLoading } = useRecentArtists(20);
  const { data: recentAlbums, isLoading: recentAlbumsLoading } = useRecentAlbums(20);

  const isLoading = playlistsLoading || ownedLoading || likedLoading || followedLoading || recentArtistsLoading || recentAlbumsLoading;

  const libraryItems = useMemo(() => {
    const items: LibraryItem[] = [];

    // Liked Songs special item (always first when showing playlists or all)
    if ((filter === "all" || filter === "playlists") && likedTracks && likedTracks.length > 0) {
      items.push({
        id: "liked-songs",
        type: "liked-songs",
        title: "Liked Songs",
        subtitle: `${likedTracks.length} song${likedTracks.length !== 1 ? "s" : ""}`,
        imageUrl: null, // Special gradient treatment
        imageShape: "square",
        isPinned: true,
        lastInteractedAt: Date.now(), // Always recent
        trackCount: likedTracks.length,
        linkTo: "/library?filter=liked",
      });
    }

    // Playlists
    if (filter === "all" || filter === "playlists") {
      playlists.forEach((playlist: Playlist) => {
        items.push({
          id: playlist.id,
          type: "playlist",
          title: playlist.name,
          subtitle: `Playlist • ${playlist.track_count || 0} song${(playlist.track_count || 0) !== 1 ? "s" : ""}`,
          imageUrl: playlist.cover_image_url || playlist.cover_tracks?.[0]?.cover_art_url || null,
          imageShape: "square",
          lastInteractedAt: new Date(playlist.updated_at).getTime(),
          trackCount: playlist.track_count,
          linkTo: `/playlist/${playlist.id}`,
        });
      });
    }

    // Albums from owned tracks or recent plays
    if (filter === "all" || filter === "albums") {
      recentAlbums?.forEach((album) => {
        items.push({
          id: album.id,
          type: "album",
          title: album.title,
          subtitle: `${album.release_type} • ${album.artist?.display_name || "Unknown"}`,
          imageUrl: album.cover_art_url,
          imageShape: "square",
          lastInteractedAt: album.lastInteractedAt,
          linkTo: `/album/${album.id}`,
        });
      });
    }

    // Artists (followed + recent)
    if (filter === "all" || filter === "artists") {
      // Combine followed artists and recent artists, dedupe
      const artistMap = new Map<string, LibraryItem>();

      // Add followed artists first
      followedArtists?.forEach((artist) => {
        artistMap.set(artist.id, {
          id: artist.id,
          type: "artist",
          title: artist.display_name || "Unknown Artist",
          subtitle: "Artist",
          imageUrl: artist.avatar_url,
          imageShape: "rounded",
          lastInteractedAt: new Date(artist.followed_at).getTime(),
          linkTo: artist.role === "label" ? `/label/${artist.id}` : `/artist/${artist.id}`,
        });
      });

      // Add recent artists (if not already in followed)
      recentArtists?.forEach((artist) => {
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, {
            id: artist.id,
            type: "artist",
            title: artist.display_name || "Unknown Artist",
            subtitle: "Artist",
            imageUrl: artist.avatar_url,
            imageShape: "rounded",
            lastInteractedAt: artist.lastPlayedAt,
            linkTo: `/artist/${artist.id}`,
          });
        }
      });

      artistMap.forEach((item) => items.push(item));
    }

    // Downloaded/Owned tracks
    if (filter === "all" || filter === "downloaded") {
      ownedTracks?.forEach((purchase) => {
        if (purchase.track) {
          items.push({
            id: purchase.track.id,
            type: "track",
            title: purchase.track.title,
            subtitle: purchase.track.artist?.display_name || "Unknown Artist",
            imageUrl: purchase.track.cover_art_url,
            imageShape: "square",
            isDownloaded: true,
            lastInteractedAt: new Date(purchase.purchased_at).getTime(),
            linkTo: `/browse`, // Could navigate to track detail
          });
        }
      });
    }

    // Sort items
    let sortedItems = [...items];
    
    // Always keep pinned items first
    const pinnedItems = sortedItems.filter((item) => item.isPinned);
    const unpinnedItems = sortedItems.filter((item) => !item.isPinned);

    switch (sort) {
      case "alphabetical":
        unpinnedItems.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "recently-added":
        // For now, same as recents
        unpinnedItems.sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);
        break;
      case "recents":
      default:
        unpinnedItems.sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);
        break;
    }

    return [...pinnedItems, ...unpinnedItems];
  }, [playlists, ownedTracks, likedTracks, followedArtists, recentArtists, recentAlbums, filter, sort]);

  return { libraryItems, isLoading };
}
