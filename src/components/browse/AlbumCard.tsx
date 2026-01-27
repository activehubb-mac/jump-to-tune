import { Link } from "react-router-dom";
import { Disc3, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHoverOverlay } from "@/components/ui/card-hover-overlay";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatters";

interface AlbumCardProps {
  album: {
    id: string;
    title: string;
    cover_art_url: string | null;
    release_type: string;
    genre: string | null;
    total_price: number | null;
    artist?: {
      id: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export function AlbumCard({ album }: AlbumCardProps) {
  const { playTrack, addToQueue, clearQueue } = useAudioPlayer();

  // Fetch album tracks for play functionality (two-step pattern for profiles_public view)
  const { data: tracks = [] } = useQuery({
    queryKey: ["album-tracks-preview", album.id],
    queryFn: async () => {
      // Step 1: Fetch tracks without profile join
      const { data: tracksData, error } = await supabase
        .from("tracks")
        .select("id, title, audio_url, cover_art_url, duration, artist_id, price")
        .eq("album_id", album.id)
        .eq("is_draft", false)
        .order("track_number", { ascending: true })
        .limit(10);

      if (error) throw error;
      if (!tracksData || tracksData.length === 0) return [];

      // Step 2: Get unique artist IDs and fetch profiles separately
      const artistIds = [...new Set(tracksData.map(t => t.artist_id).filter(Boolean))];
      
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      // Step 3: Map artists to tracks
      const artistMap = new Map(artists?.map(a => [a.id, a]) || []);
      return tracksData.map(track => ({
        ...track,
        artist: artistMap.get(track.artist_id) || null
      }));
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const handlePlayAlbum = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tracks.length === 0) return;

    clearQueue();

    const firstTrack = {
      id: tracks[0].id,
      title: tracks[0].title,
      audio_url: tracks[0].audio_url,
      cover_art_url: tracks[0].cover_art_url || album.cover_art_url,
      duration: tracks[0].duration,
      price: tracks[0].price,
      artist: tracks[0].artist,
    };

    playTrack(firstTrack);

    // Add remaining tracks to queue
    tracks.slice(1).forEach((track) => {
      addToQueue({
        id: track.id,
        title: track.title,
        audio_url: track.audio_url,
        cover_art_url: track.cover_art_url || album.cover_art_url,
        duration: track.duration,
        price: track.price,
        artist: track.artist,
      });
    });
  };

  return (
    <Link 
      to={`/album/${album.id}`}
      className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300 block"
    >
      {/* Album Art */}
      <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
        {album.cover_art_url ? (
          <img
            src={album.cover_art_url}
            alt={album.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Disc3 className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Release Type Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm">
          <span className="text-xs font-medium text-primary uppercase">
            {album.release_type}
          </span>
        </div>

        {/* Play Button Overlay */}
        <CardHoverOverlay>
          <Button 
            size="icon" 
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 w-12 h-12"
            onClick={handlePlayAlbum}
          >
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        </CardHoverOverlay>
      </div>

      {/* Album Info */}
      <div>
        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {album.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {album.artist?.display_name || "Unknown Artist"}
        </p>
        <div className="flex items-center justify-between mt-2">
          {album.genre && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {album.genre}
            </span>
          )}
          {album.total_price !== null && album.total_price > 0 && (
            <span className="text-sm font-medium text-primary">
              {formatPrice(album.total_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
