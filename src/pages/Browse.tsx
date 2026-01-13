import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Disc3, Play, Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublishedTracks } from "@/hooks/useTracks";
import { formatPrice, formatEditions } from "@/lib/formatters";

const genres = ["All", "Electronic", "Hip Hop", "R&B", "Pop", "Rock", "Jazz", "Classical", "Indie"];

export default function Browse() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: tracks, isLoading } = usePublishedTracks({
    genre: selectedGenre,
    searchQuery: searchQuery || undefined,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Music</h1>
          <p className="text-muted-foreground">Discover and collect exclusive tracks from talented artists</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search tracks, artists, or genres..."
              className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-glass-border hover:border-primary/50 h-12">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Genre Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === genre
                  ? "bg-primary text-primary-foreground neon-glow-subtle"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Track Grid */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
              >
                {/* Album Art */}
                <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
                  {track.cover_art_url ? (
                    <img
                      src={track.cover_art_url}
                      alt={track.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Disc3 className="w-16 h-16 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="icon" className="rounded-full gradient-accent neon-glow w-12 h-12">
                      <Play className="w-5 h-5 ml-0.5" />
                    </Button>
                  </div>
                  {/* Like Button */}
                  <button className="absolute top-2 right-2 p-2 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80">
                    <Heart className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* Track Info */}
                <div>
                  <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                  <Link
                    to={`/artist/${track.artist?.id}`}
                    className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {track.artist?.display_name || "Unknown Artist"}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-primary">{formatPrice(track.price)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatEditions(track.editions_sold, track.total_editions)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Disc3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tracks found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedGenre !== "All"
                ? "Try adjusting your filters or search query"
                : "Be the first to upload music!"}
            </p>
          </div>
        )}

        {/* Load More */}
        {tracks && tracks.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-glass-border hover:border-primary/50 px-8">
              Load More
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
