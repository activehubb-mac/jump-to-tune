import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Disc3, Play, Music, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Collection() {
  const isLoggedIn = false; // Will be replaced with actual auth state

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Collection Awaits</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to view your music collection and manage your owned tracks.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="gradient-accent neon-glow-subtle" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="outline" className="border-glass-border" asChild>
                <Link to="/auth?mode=signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Collection</h1>
          <p className="text-muted-foreground">Your owned tracks and music collection</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">12</div>
            <div className="text-sm text-muted-foreground">Tracks Owned</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">5</div>
            <div className="text-sm text-muted-foreground">Artists Followed</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">0.5</div>
            <div className="text-sm text-muted-foreground">ETH Spent</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">3</div>
            <div className="text-sm text-muted-foreground">Rare Editions</div>
          </div>
        </div>

        {/* Collection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
            >
              <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" className="rounded-full gradient-accent w-10 h-10">
                    <Play className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/80 text-xs text-foreground font-medium">
                  #{i + 1}/100
                </div>
              </div>
              <h3 className="font-semibold text-foreground truncate">Owned Track #{i + 1}</h3>
              <p className="text-sm text-muted-foreground truncate">Artist Name</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
