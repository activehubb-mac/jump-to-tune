import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecentAlbum {
  id: string;
  title: string;
  cover_art_url: string | null;
  release_type: string;
  artist: {
    id: string;
    display_name: string | null;
  } | null;
  lastInteractedAt: number;
}

export function useRecentAlbums(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-albums", user?.id, limit],
    queryFn: async (): Promise<RecentAlbum[]> => {
      if (!user) return [];

      // Get albums from user's purchased tracks
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select(`
          purchased_at,
          track:tracks!inner (
            album_id,
            artist_id
          )
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      if (!purchases || purchases.length === 0) return [];

      // Get unique album IDs with most recent interaction
      const albumMap = new Map<string, number>();
      purchases.forEach((p: any) => {
        if (p.track?.album_id) {
          const existing = albumMap.get(p.track.album_id);
          const purchaseTime = new Date(p.purchased_at).getTime();
          if (!existing || purchaseTime > existing) {
            albumMap.set(p.track.album_id, purchaseTime);
          }
        }
      });

      if (albumMap.size === 0) return [];

      const albumIds = Array.from(albumMap.keys()).slice(0, limit);

      // Fetch album details
      const { data: albums, error: albumsError } = await supabase
        .from("albums")
        .select("id, title, cover_art_url, release_type, artist_id")
        .in("id", albumIds)
        .eq("is_draft", false);

      if (albumsError) throw albumsError;
      if (!albums || albums.length === 0) return [];

      // Fetch artist names
      const artistIds = [...new Set(albums.map((a) => a.artist_id))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return albums
        .map((album) => ({
          id: album.id,
          title: album.title,
          cover_art_url: album.cover_art_url,
          release_type: album.release_type,
          artist: artistMap.get(album.artist_id) || null,
          lastInteractedAt: albumMap.get(album.id) || 0,
        }))
        .sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);
    },
    enabled: !!user,
  });
}
