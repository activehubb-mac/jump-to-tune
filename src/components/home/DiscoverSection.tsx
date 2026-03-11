import { useRef } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Clock, Users, Play, Disc3, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useNewReleases } from "@/hooks/useNewReleases";
import { useRecommendedArtists } from "@/hooks/useRecommendedArtists";
import { cn } from "@/lib/utils";
import { FloatingCard } from "@/components/effects/FloatingCard";

function HorizontalTrackRow({
  title,
  icon: Icon,
  iconColor,
  tracks,
  isLoading,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  tracks: Array<{
    id: string;
    title: string;
    audio_url: string;
    cover_art_url: string | null;
    artist_id: string;
    artist_name: string | null;
  }> | undefined;
  isLoading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
          <Icon className={cn("w-5 h-5", iconColor)} />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="hidden md:flex w-8 h-8 items-center justify-center rounded-full glass-card-bordered hover:bg-primary/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={() => scroll(1)} className="hidden md:flex w-8 h-8 items-center justify-center rounded-full glass-card-bordered hover:bg-primary/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {tracks?.map((track) => {
            const isCurrent = currentTrack?.id === track.id && isPlaying;
            return (
              <FloatingCard
                key={track.id}
                depth="sm"
                glowColor="hsl(var(--primary) / 0.12)"
                className="flex-shrink-0 w-40 md:w-44 group cursor-pointer"
                onClick={() => playTrack({
                  id: track.id,
                  title: track.title,
                  audio_url: track.audio_url,
                  cover_art_url: track.cover_art_url,
                  artist: { id: track.artist_id, display_name: track.artist_name },
                })}
              >
                <div className="aspect-square rounded-xl bg-muted/50 mb-3 overflow-hidden relative">
                  {track.cover_art_url ? (
                    <img src={track.cover_art_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isCurrent ? "bg-accent" : "bg-primary"
                    )}>
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  {/* Glow ring on hover */}
                  <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-1 ring-primary/30 transition-all pointer-events-none" />
                </div>
                <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {track.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist_name || "Unknown Artist"}
                </p>
              </FloatingCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DiscoverSection() {
  const { data: trending, isLoading: trendingLoading } = useTrendingTracks(12);
  const { data: newReleases, isLoading: newLoading } = useNewReleases(12);
  const { data: risingArtists, isLoading: artistsLoading } = useRecommendedArtists(12);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Discover</h2>
            <p className="text-muted-foreground mt-2 text-lg">Find your next favorite track</p>
          </div>
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link to="/browse">Browse All</Link>
          </Button>
        </div>

        <HorizontalTrackRow title="Trending Tracks" icon={TrendingUp} iconColor="text-accent" tracks={trending} isLoading={trendingLoading} />
        <HorizontalTrackRow title="New Releases" icon={Clock} iconColor="text-primary" tracks={newReleases} isLoading={newLoading} />

        {/* Rising Artists */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-5 h-5 text-secondary" />
              Rising Artists
            </h3>
          </div>

          {artistsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {risingArtists?.map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.id}`} className="flex-shrink-0 w-32 md:w-36 text-center group">
                  <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-muted/50 overflow-hidden mb-3 group-hover:scale-105 transition-transform border-2 border-border group-hover:border-primary/50 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {artist.display_name || "Unknown"}
                  </h4>
                  <p className="text-xs text-muted-foreground">{artist.trackCount} tracks</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="text-center md:hidden mt-4">
          <Button variant="outline" asChild>
            <Link to="/browse">Browse All</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
