import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Users, Music } from "lucide-react";
import { Link } from "react-router-dom";

export default function Labels() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Labels</h1>
          <p className="text-muted-foreground">Explore music labels and their artist rosters</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search labels..."
            className="pl-10 bg-muted/50 border-glass-border focus:border-primary h-12"
          />
        </div>

        {/* Featured Labels */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Labels</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Link
                key={i}
                to={`/label/${i + 1}`}
                className="glass-card p-6 group hover:border-accent/50 hover:neon-glow-subtle transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-accent/50 to-primary/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-12 h-12 text-foreground" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                      Featured Label {i + 1}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      Leading independent label specializing in electronic and experimental music.
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        8 artists
                      </span>
                      <span className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        156 tracks
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All Labels Grid */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">All Labels</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Link
                key={i}
                to={`/label/${i + 1}`}
                className="glass-card p-6 text-center group hover:border-accent/50 transition-all duration-300"
              >
                {/* Logo */}
                <div className="w-20 h-20 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Label {i + 1}</h3>
                <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 8) + 2} artists</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-glass-border hover:border-accent/50 px-8">
            Load More Labels
          </Button>
        </div>
      </div>
    </Layout>
  );
}
