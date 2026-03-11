import { useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, Play, Pause, Music2, ListPlus, Lock } from "lucide-react";
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
import { formatPrice } from "@/lib/formatters";
import { FeaturedOnTrack } from "@/hooks/useFeaturedOnTracks";

interface FeaturedOnCarouselProps {
  tracks: FeaturedOnTrack[];
  featuredArtistName: string;
}

export function FeaturedOnCarousel({ tracks, featuredArtistName }: FeaturedOnCarouselProps) {
  const { playTrack, addToQueue, currentTrack, isPlaying } = useAudioPlayer();
  const { canUseFeature } = useFeatureGate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  if (!tracks || tracks.length === 0) return null;

  const handleAddToQueue = (track: FeaturedOnTrack) => {
    if (!canUseFeature("addToQueue")) {
      setShowPremiumModal(true);
      return;
    }
    addToQueue({
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url,
      duration: track.duration,
      artist: {
        id: track.primary_artist.id,
        display_name: track.primary_artist.display_name,
      },
    });
  };

  return (
    <section className="mb-12">
      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature="Add to Queue"
      />

      <div className="flex items-center gap-3 mb-6">
        <Music2 className="w-6 h-6 text-accent" />
        <h2 className="text-2xl font-bold text-foreground">Featured On</h2>
      </div>

      <div className="relative px-12">
        <Carousel
          opts={{
            align: "start",
            loop: tracks.length > 3,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {tracks.map((track) => (
              <CarouselItem
                key={track.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <div className="glass-card overflow-hidden group cursor-pointer hover:bg-primary/10 transition-all duration-300">
                  {/* Large Cover Art */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {track.cover_art_url ? (
                      <img
                        src={track.cover_art_url}
                        alt={track.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Disc3 className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                    {/* Play Controls */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        className="rounded-full gradient-accent neon-glow w-14 h-14"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack({
                            id: track.id,
                            title: track.title,
                            audio_url: track.audio_url,
                            cover_art_url: track.cover_art_url,
                            duration: track.duration,
                            artist: {
                              id: track.primary_artist.id,
                              display_name: track.primary_artist.display_name,
                            },
                          });
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full w-10 h-10 border-white/30 bg-background hover:bg-muted relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToQueue(track);
                        }}
                      >
                        <ListPlus className="w-4 h-4" />
                        {!canUseFeature("addToQueue") && (
                          <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground truncate mb-1">
                      {track.title}
                    </h3>
                    <Link
                      to={`/artist/${track.primary_artist.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block"
                    >
                      {track.primary_artist.display_name || "Unknown Artist"}{" "}
                      <span className="text-accent">feat. {featuredArtistName}</span>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-primary font-medium">
                        {formatPrice(track.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {track.editions_sold}/{track.total_editions} sold
                      </span>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-glass-border bg-background/80 backdrop-blur-sm hover:bg-primary/20" />
          <CarouselNext className="border-glass-border bg-background/80 backdrop-blur-sm hover:bg-primary/20" />
        </Carousel>
      </div>
    </section>
  );
}
