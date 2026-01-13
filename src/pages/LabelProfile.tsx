import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Building2, Users, Music, Share2, ExternalLink, Disc3 } from "lucide-react";

export default function LabelProfile() {
  const { id } = useParams();

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 bg-gradient-to-b from-accent/30 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          {/* Logo */}
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center neon-glow border-4 border-background">
            <Building2 className="w-16 h-16 text-foreground" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
                Verified Label
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Label Name</h1>
            <p className="text-muted-foreground max-w-2xl mb-4">
              Leading independent label specializing in electronic and experimental music. 
              Championing innovative artists since 2015.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-foreground font-medium">8</span>
                <span className="text-muted-foreground">artists</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-accent" />
                <span className="text-foreground font-medium">156</span>
                <span className="text-muted-foreground">tracks</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button className="bg-accent hover:bg-accent/90 neon-glow-subtle hover:neon-glow">
                Follow Label
              </Button>
              <Button variant="outline" className="border-glass-border hover:border-accent/50">
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

        {/* Artists Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Link
                key={i}
                to={`/artist/${i + 1}`}
                className="glass-card p-4 text-center group hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Music className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Artist {i + 1}</h3>
                <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 30) + 5} tracks</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Releases */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Latest Releases</h2>
            <Button variant="ghost" className="text-accent">View All</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass-card p-4 group cursor-pointer hover:border-accent/50 transition-all duration-300"
              >
                <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground truncate">Track #{i + 1}</h3>
                <p className="text-sm text-muted-foreground truncate">Artist Name</p>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="glass-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">About</h2>
          <p className="text-muted-foreground leading-relaxed">
            Founded in 2015, this label has been at the forefront of electronic and experimental music. 
            With a roster of 8 talented artists from around the globe, they continue to push the 
            boundaries of what's possible in modern music production.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Their commitment to artist development and sonic innovation has earned them a dedicated 
            following and critical acclaim. From ambient soundscapes to hard-hitting club tracks, 
            their catalog spans the full spectrum of electronic music.
          </p>
        </section>
      </div>
    </Layout>
  );
}
