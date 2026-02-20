import { Music, Play } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface Purchase {
  id: string;
  edition_number: number;
  price_paid: number;
  purchased_at: string;
  track?: {
    id: string;
    title: string;
    cover_art_url: string | null;
    audio_url: string;
    total_editions: number;
    artist?: { id: string; display_name: string | null };
  } | null;
}

interface DigitalCollectionProps {
  purchases: Purchase[];
  isLoading: boolean;
}

export function DigitalCollection({ purchases, isLoading }: DigitalCollectionProps) {
  const { playTrack } = useAudioPlayer();

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Digital Collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Digital Collection</h2>
      {purchases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tracks in your vault yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="group cursor-pointer"
              onClick={() => {
                if (purchase.track) {
                  playTrack({
                    id: purchase.track.id,
                    title: purchase.track.title,
                    audio_url: purchase.track.audio_url,
                    cover_art_url: purchase.track.cover_art_url,
                    artist: purchase.track.artist
                      ? { id: purchase.track.artist.id, display_name: purchase.track.artist.display_name }
                      : undefined,
                  });
                }
              }}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/50 border-2 border-glass-border group-hover:border-primary/50 transition-all">
                {purchase.track?.cover_art_url ? (
                  <img src={purchase.track.cover_art_url} alt={purchase.track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                  #{purchase.edition_number}
                </div>
              </div>
              <p className="font-medium text-sm truncate mt-1.5">{purchase.track?.title || "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {purchase.track?.artist?.display_name || "Unknown Artist"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
