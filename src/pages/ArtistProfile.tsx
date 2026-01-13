import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Music, Users, Play, Heart, Share2, ExternalLink, Disc3 } from "lucide-react";

export default function ArtistProfile() {
  const { id } = useParams();

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 bg-gradient-to-b from-primary/30 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          {/* Avatar */}
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow border-4 border-background">
            <Music className="w-16 h-16 text-foreground" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                Verified Artist
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Artist Name</h1>
            <p className="text-muted-foreground max-w-2xl mb-4">
              Award-winning producer and artist pushing the boundaries of electronic music. 
              Creating sonic landscapes that transport listeners to new dimensions.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">24</span>
                <span className="text-muted-foreground">tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">12.5K</span>
                <span className="text-muted-foreground">fans</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent" />
                <span className="text-foreground font-medium">45K</span>
                <span className="text-muted-foreground">likes</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button className="gradient-accent neon-glow-subtle hover:neon-glow">
                <Heart className="w-4 h-4 mr-2" />
                Follow
              </Button>
              <Button variant="outline" className="border-glass-border hover:border-primary/50">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-4 h-4 mr-2" />
                Website
              </Button>
            </div>
          </div>
        </div>

        {/* Tracks Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tracks</h2>
            <Button variant="ghost" className="text-primary">View All</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="glass-card p-4 group cursor-pointer hover:border-primary/50 transition-all duration-300"
              >
                {/* Album Art */}
                <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" className="rounded-full gradient-accent w-10 h-10">
                      <Play className="w-4 h-4 ml-0.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground truncate">Track #{i + 1}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-primary">0.05 ETH</span>
                  <span className="text-xs text-muted-foreground">50/100</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="glass-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">About</h2>
          <p className="text-muted-foreground leading-relaxed">
            With over a decade of experience in music production, this artist has crafted a unique sound 
            that blends electronic elements with organic instrumentation. Their work has been featured in 
            major film soundtracks and has earned them recognition from critics and fans worldwide.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Based in Los Angeles, they continue to push creative boundaries and explore new sonic territories. 
            Their commitment to artistic integrity and innovation has made them a respected figure in the 
            electronic music community.
          </p>
        </section>
      </div>
    </Layout>
  );
}
