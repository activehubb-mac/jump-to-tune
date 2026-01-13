import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Disc3, Play, Music, Lock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Collection() {
  const { user, profile, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Not logged in - show sign in prompt
  if (!user) {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {profile?.display_name ? `${profile.display_name}'s Collection` : "My Collection"}
          </h1>
          <p className="text-muted-foreground">Your owned tracks and music collection</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">0</div>
            <div className="text-sm text-muted-foreground">Tracks Owned</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">0</div>
            <div className="text-sm text-muted-foreground">Artists Followed</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">0</div>
            <div className="text-sm text-muted-foreground">ETH Spent</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">0</div>
            <div className="text-sm text-muted-foreground">Rare Editions</div>
          </div>
        </div>

        {/* Empty State */}
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-6">
            <Music className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your collection is empty</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start building your collection by browsing and purchasing tracks from talented artists.
          </p>
          <Button className="gradient-accent neon-glow-subtle hover:neon-glow" asChild>
            <Link to="/browse">
              <Disc3 className="w-4 h-4 mr-2" />
              Browse Music
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}