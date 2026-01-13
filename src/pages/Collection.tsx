import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Disc3, Play, Music, Lock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionStats, useOwnedTracks } from "@/hooks/useCollectionStats";
import { formatPrice } from "@/lib/formatters";

export default function Collection() {
  const { user, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCollectionStats(user?.id);
  const { data: ownedTracks, isLoading: tracksLoading } = useOwnedTracks(user?.id);

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

  const isDataLoading = statsLoading || tracksLoading;

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
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats?.tracksOwned ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Tracks Owned</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats?.artistsFollowed ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Artists Followed</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                formatPrice(stats?.totalSpent ?? 0)
              )}
            </div>
            <div className="text-sm text-muted-foreground">USD Spent</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-bold text-gradient">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats?.rareEditions ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Rare Editions</div>
          </div>
        </div>

        {/* Owned Tracks or Empty State */}
        {tracksLoading ? (
          <div className="glass-card p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : ownedTracks && ownedTracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {ownedTracks.map((purchase) => (
              <div
                key={purchase.id}
                className="glass-card p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300"
              >
                {/* Album Art */}
                <div className="aspect-square rounded-lg bg-muted/50 mb-4 relative overflow-hidden">
                  {purchase.track?.cover_art_url ? (
                    <img
                      src={purchase.track.cover_art_url}
                      alt={purchase.track.title}
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
                  {/* Edition Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-xs font-medium text-primary-foreground">
                    #{purchase.edition_number}
                  </div>
                </div>

                {/* Track Info */}
                <div>
                  <h3 className="font-semibold text-foreground truncate">{purchase.track?.title}</h3>
                  <Link
                    to={`/artist/${purchase.track?.artist?.id}`}
                    className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block"
                  >
                    {purchase.track?.artist?.display_name || "Unknown Artist"}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-primary">
                      {formatPrice(purchase.price_paid)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of {purchase.track?.total_editions}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  );
}
