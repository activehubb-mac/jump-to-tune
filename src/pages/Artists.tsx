import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Music, Users, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function Artists() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Artists</h1>
          <p className="text-muted-foreground">Discover talented artists and explore their music collections</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12"
          />
        </div>

        {/* Featured Artists */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Artists</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Link
                key={i}
                to={`/artist/${i + 1}`}
                className="glass-card p-6 group hover:bg-primary/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Music className="w-8 h-8 text-foreground" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      Featured Artist {i + 1}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      Award-winning producer and artist pushing the boundaries of electronic music.
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        24 tracks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        12.5K fans
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All Artists Grid */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">All Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <Link
                key={i}
                to={`/artist/${i + 1}`}
                className="glass-card p-4 text-center group hover:bg-primary/10 transition-all duration-300"
              >
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Music className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground truncate">Artist {i + 1}</h3>
                <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 50) + 5} tracks</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-glass-border hover:border-primary/50 px-8">
            Load More Artists
          </Button>
        </div>
      </div>
    </Layout>
  );
}
