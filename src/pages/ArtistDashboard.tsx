import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Music, Upload, DollarSign, Users, TrendingUp, BarChart3, Plus, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistStats } from "@/hooks/useArtistStats";
import { useArtistTracks } from "@/hooks/useTracks";
import { formatEarnings } from "@/lib/formatters";
import { TrackCard } from "@/components/dashboard/TrackCard";

export default function ArtistDashboard() {
  const { user, role, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useArtistStats(user?.id);
  const { data: tracks, isLoading: tracksLoading } = useArtistTracks(user?.id);

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
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist Dashboard</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to access your artist dashboard and manage your music.
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/auth?role=artist">Sign In as Artist</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Logged in but not an artist - show access denied
  if (role !== "artist") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist Access Only</h1>
            <p className="text-muted-foreground mb-8">
              This dashboard is for artists only. 
              {role === "label" && " Check out your Label Dashboard instead!"}
              {role === "fan" && " Browse our collection and discover new music!"}
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to={role === "label" ? "/label/dashboard" : "/browse"}>
                {role === "label" ? "Go to Label Dashboard" : "Browse Music"}
              </Link>
            </Button>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {profile?.display_name ? `Welcome, ${profile.display_name}` : "Artist Dashboard"}
            </h1>
            <p className="text-muted-foreground">Manage your music and track your earnings</p>
          </div>
          <Button className="gradient-accent neon-glow-subtle hover:neon-glow" asChild>
            <Link to="/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Track
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Tracks</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.totalTracks ?? 0}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {isDataLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                formatEarnings(stats?.totalEarnings ?? 0)
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Collectors</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.collectorsCount ?? 0}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-muted-foreground text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {isDataLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : stats?.thisMonthSales ? (
                `${stats.thisMonthSales} sales`
              ) : (
                "--"
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Tracks */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Your Tracks</h2>
              {tracks && tracks.length > 0 && (
                <Button variant="ghost" size="sm" className="text-primary">View All</Button>
              )}
            </div>
            
            {tracksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tracks && tracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tracks.slice(0, 6).map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    showActions
                    onEdit={(id) => console.log("Edit track:", id)}
                    onDelete={(id) => console.log("Delete track:", id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You haven't uploaded any tracks yet.</p>
                <Button className="mt-4 gradient-accent" asChild>
                  <Link to="/upload">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Your First Track
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50" asChild>
                <Link to="/upload">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload New Track
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50">
                <Users className="w-4 h-4 mr-2" />
                Manage Collectors
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
