import { useState } from "react";
import { Link } from "react-router-dom";
import { Disc3, Play, Pause, Users, Music, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useRecommendedArtists } from "@/hooks/useRecommendedArtists";
import { useAuth } from "@/contexts/AuthContext";
import { formatCompactNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function HeroCarousel() {
  const { user } = useAuth();
  const { data: trendingTracks, isLoading: tracksLoading } = useTrendingTracks(8);
  const { data: recommendedArtists, isLoading: artistsLoading } = useRecommendedArtists(6);
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();

  const isLoading = tracksLoading || artistsLoading;

  // Combine featured items: trending tracks and recommended artists
  const featuredItems = [
    ...(trendingTracks?.slice(0, 4).map((track) => ({
      type: "track" as const,
      id: track.id,
      title: track.title,
      subtitle: track.artist_name || "Unknown Artist",
      image: track.cover_art_url,
      artist_id: track.artist_id,
      audio_url: track.audio_url,
      price: track.price,
      has_karaoke: track.has_karaoke,
    })) || []),
    ...(user && recommendedArtists?.slice(0, 3).map((artist) => ({
      type: "artist" as const,
      id: artist.id,
      title: artist.display_name || "Unknown Artist",
      subtitle: `${artist.trackCount} tracks • ${formatCompactNumber(artist.followerCount)} fans`,
      image: artist.avatar_url,
    })) || []),
  ];

  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="relative px-12">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3">
                <Skeleton className="aspect-[16/9] rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featuredItems.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-1 bg-primary rounded-full" />
        <h2 className="text-xl font-bold text-foreground">Featured</h2>
      </div>

      <div className="relative px-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {featuredItems.map((item) => (
              <CarouselItem
                key={`${item.type}-${item.id}`}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                {item.type === "track" ? (
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden group cursor-pointer">
                    {/* Background Image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Disc3 className="w-20 h-20 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Gradient Overlay - dark charcoal for premium look */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/90 via-[#1a1a1a]/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-end justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-accent/80 text-accent-foreground text-xs font-medium">
                              Trending
                            </span>
                            {item.has_karaoke && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground text-xs font-medium">
                                <Mic2 className="w-3 h-3" />
                                Sing-along
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-white truncate drop-shadow-md">
                            {item.title}
                          </h3>
                          <Link
                            to={`/artist/${item.artist_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-sm"
                          >
                            {item.subtitle}
                          </Link>
                        </div>
                        <Button
                          size="icon"
                          className="rounded-full gradient-accent neon-glow w-12 h-12 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.audio_url) {
                              playTrack({
                                id: item.id,
                                title: item.title,
                                audio_url: item.audio_url,
                                cover_art_url: item.image,
                                artist: {
                                  id: item.artist_id || "",
                                  display_name: item.subtitle,
                                },
                              });
                            }
                          }}
                        >
                          {currentTrack?.id === item.id && isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={`/artist/${item.id}`}
                    className="block relative aspect-[16/9] rounded-xl overflow-hidden group"
                  >
                    {/* Background */}
                    <div className="absolute inset-0 bg-muted/50" />
                    
                    {/* Avatar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {item.image ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background/50 group-hover:scale-110 transition-transform duration-300">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center border-4 border-background/50 group-hover:scale-110 transition-transform duration-300">
                          <Music className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#1a1a1a]/90 to-transparent">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs text-primary font-medium">Artist</span>
                      </div>
                      <h3 className="text-xl font-bold text-white truncate drop-shadow-md">
                        {item.title}
                      </h3>
                      <p className="text-sm text-white/70 drop-shadow-sm">{item.subtitle}</p>
                    </div>
                  </Link>
                )}
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
