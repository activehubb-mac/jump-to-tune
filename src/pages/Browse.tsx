import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Disc3, Play, Heart } from "lucide-react";

const genres = ["All", "Electronic", "Hip Hop", "R&B", "Pop", "Rock", "Jazz", "Classical", "Indie"];

export default function Browse() {
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
            />
          </div>
          <Button variant="outline" className="border-glass-border hover:border-primary/50 h-12">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Genre Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {genres.map((genre, index) => (
            <button
              key={genre}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                index === 0
                  ? "bg-primary text-primary-foreground neon-glow-subtle"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Track Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
            >
              {/* Album Art */}
              <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Disc3 className="w-16 h-16 text-muted-foreground/50" />
                </div>
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
                <h3 className="font-semibold text-foreground truncate">Track Name #{i + 1}</h3>
                <p className="text-sm text-muted-foreground truncate">Artist Name</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-primary">0.05 ETH</span>
                  <span className="text-xs text-muted-foreground">50/100</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-glass-border hover:border-primary/50 px-8">
            Load More
          </Button>
        </div>
      </div>
    </Layout>
  );
}
