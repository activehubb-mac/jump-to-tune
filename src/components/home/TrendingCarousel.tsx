import { useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, Play, TrendingUp, ListPlus, Lock, Loader2, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PremiumFeatureModal } from "@/components/premium/PremiumFeatureModal";
import { DownloadButton } from "@/components/download/DownloadButton";
import { useTrendingTracks, TrendingTrack } from "@/hooks/useTrendingTracks";

interface TrendingCarouselProps {
  onAddToQueue: (track: Parameters<ReturnType<typeof useAudioPlayer>["addToQueue"]>[0]) => void;
}

export function TrendingCarousel({ onAddToQueue }: TrendingCarouselProps) {
  const { data: trendingTracks, isLoading } = useTrendingTracks(12);
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleAddToQueue = (track: TrendingTrack) => {
    if (!canUseFeature("addToQueue")) {
      setShowPremiumModal(true);
      return;
    }
    onAddToQueue({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      artist: {
        id: track.artist_id,
        display_name: track.artist_name,
      },
    });
  };

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-accent" />
            <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
          </div>
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!trendingTracks || trendingTracks.length === 0) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-accent" />
            <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border shadow-sm rounded-xl p-4">
                <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="h-4 bg-muted/50 rounded mb-2" />
                <div className="h-3 bg-muted/30 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-accent" />
              Trending Now
            </h2>
            <p className="text-muted-foreground mt-2">The hottest tracks on JumTunes right now</p>
          </div>
          <Button variant="outline" className="hidden md:flex" asChild>
            <Link to="/browse">View All</Link>
          </Button>
        </div>

        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: trendingTracks.length > 4,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {trendingTracks.map((track) => (
                <CarouselItem
                  key={track.id}
                  className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                >
                  <div
                    className="bg-card border border-border shadow-sm rounded-xl p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
                    onClick={() =>
                      playTrack({
                        id: track.id,
                        title: track.title,
                        audio_url: track.audio_url,
                        cover_art_url: track.cover_art_url,
                        artist: {
                          id: track.artist_id,
                          display_name: track.artist_name,
                        },
                      })
                    }
                  >
                    <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                      {track.cover_art_url ? (
                        <img
                          src={track.cover_art_url}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc3 className="w-12 h-12 text-muted-foreground" />
                      )}
                      {/* Karaoke Badge */}
                      {track.has_karaoke && (
                        <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary/90 text-primary-foreground" title="Sing-along available">
                          <Mic2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrack({
                              id: track.id,
                              title: track.title,
                              audio_url: track.audio_url,
                              cover_art_url: track.cover_art_url,
                              artist: { id: track.artist_id, display_name: track.artist_name },
                            });
                          }}
                          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
                        >
                          <Play className="w-5 h-5 text-accent-foreground ml-0.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue(track);
                          }}
                          className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 relative"
                          title={canUseFeature("addToQueue") ? "Add to queue" : "Subscribe to add to queue"}
                        >
                          {canUseFeature("addToQueue") ? (
                            <ListPlus className="w-5 h-5 text-white" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/70" />
                          )}
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DownloadButton
                            track={{
                              id: track.id,
                              title: track.title,
                              cover_art_url: track.cover_art_url,
                              price: track.price,
                              audio_url: track.audio_url,
                              artist: { display_name: track.artist_name },
                            }}
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 rounded-full border border-white/30 text-white hover:bg-white/10"
                          />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <Link
                      to={`/artist/${track.artist_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block"
                    >
                      {track.artist_name || "Unknown Artist"}
                    </Link>
                    <div className="text-xs text-primary font-semibold mt-1">
                      ${track.price.toFixed(2)}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="border-glass-border bg-background/80 backdrop-blur-sm hover:bg-primary/20" />
            <CarouselNext className="border-glass-border bg-background/80 backdrop-blur-sm hover:bg-primary/20" />
          </Carousel>
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/browse">View All Tracks</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
