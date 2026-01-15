import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Music, 
  Upload, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Lock, 
  UserPlus, 
  AlertCircle, 
  Loader2,
  BarChart3,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLabelStats } from "@/hooks/useLabelStats";
import { useLabelTracks } from "@/hooks/useTracks";
import { useLabelRoster } from "@/hooks/useLabelRoster";
import { formatEarnings } from "@/lib/formatters";
import { TrackCard } from "@/components/dashboard/TrackCard";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";
import { EarningsWidget } from "@/components/dashboard/EarningsWidget";

export default function LabelDashboard() {
  const { user, role, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useLabelStats(user?.id);
  const { data: tracks, isLoading: tracksLoading } = useLabelTracks(user?.id);
  const { data: roster, isLoading: rosterLoading } = useLabelRoster(user?.id);
  const navigate = useNavigate();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Label Dashboard</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to access your label dashboard and manage your roster.
            </p>
            <Button className="bg-accent hover:bg-accent/90 neon-glow-subtle" asChild>
              <Link to="/auth?role=label">Sign In as Label</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Logged in but not a label - show access denied
  if (role !== "label") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Label Access Only</h1>
            <p className="text-muted-foreground mb-8">
              This dashboard is for labels only.
              {role === "artist" && " Check out your Artist Dashboard instead!"}
              {role === "fan" && " Browse our collection and discover new music!"}
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to={role === "artist" ? "/artist/dashboard" : "/browse"}>
                {role === "artist" ? "Go to Artist Dashboard" : "Browse Music"}
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isDataLoading = statsLoading || tracksLoading || rosterLoading;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Subscription Status Banner */}
        <SubscriptionStatusBanner className="mb-6" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {profile?.display_name ? `${profile.display_name}` : "Label Dashboard"}
            </h1>
            <p className="text-muted-foreground">Manage your artists and releases</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-glass-border hover:border-accent/50">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Artist
            </Button>
            <Button className="bg-accent hover:bg-accent/90 neon-glow-subtle" asChild>
              <Link to="/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Track
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid - Clickable */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-6 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-muted-foreground text-sm">Artists</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${stats?.artistCount ?? 0}/10`}
                </div>
              </div>

              <Link 
                to="/label/tracks"
                className="glass-card p-6 hover:border-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Total Tracks</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {isDataLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.totalTracks ?? 0}
                </div>
              </Link>

              <Link 
                to="/label/analytics"
                className="glass-card p-6 hover:border-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Total Earnings</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {isDataLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatEarnings(stats?.totalEarnings ?? 0)
                  )}
                </div>
              </Link>

              <Link 
                to="/label/collectors"
                className="glass-card p-6 hover:border-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-muted-foreground text-sm">Collectors</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {isDataLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    stats?.collectorsCount ?? 0
                  )}
                </div>
              </Link>
            </div>

            {/* Artists Roster */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Artist Roster</h2>
                <span className="text-sm text-muted-foreground">
                  {stats?.artistCount ?? 0} of 10 slots used
                </span>
              </div>
              
              {rosterLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : roster && roster.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roster.map((artist) => (
                    <div key={artist.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        {artist.artist?.avatar_url ? (
                          <img
                            src={artist.artist.avatar_url}
                            alt={artist.artist.display_name || "Artist"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Music className="w-6 h-6 text-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {artist.artist?.display_name || "Unknown Artist"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {artist.trackCount} tracks • {artist.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't added any artists to your roster yet.</p>
                  <Button variant="outline" className="mt-4 border-glass-border hover:border-accent/50">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Artist
                  </Button>
                </div>
              )}
            </div>

            {/* Recent Releases */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Recent Releases</h2>
                {tracks && tracks.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-accent" asChild>
                    <Link to="/label/tracks">View All</Link>
                  </Button>
                )}
              </div>
              
              {tracksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : tracks && tracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tracks.slice(0, 6).map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      showArtist
                      showActions
                      onEdit={(id) => navigate(`/track/${id}/edit`)}
                      onDelete={(id) => console.log("Delete track:", id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No releases yet. Upload your first track!</p>
                  <Button className="mt-4 bg-accent hover:bg-accent/90" asChild>
                    <Link to="/upload">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Track
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to="/upload">
                    <Upload className="w-4 h-4 mr-3" />
                    Upload Track
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to="/label/analytics">
                    <BarChart3 className="w-4 h-4 mr-3" />
                    View Analytics
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to="/label/collectors">
                    <Users className="w-4 h-4 mr-3" />
                    View Collectors
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to="/label/tracks">
                    <Music className="w-4 h-4 mr-3" />
                    Manage Tracks
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to="/label/payouts">
                    <CreditCard className="w-4 h-4 mr-3" />
                    Manage Payouts
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to="/wallet">
                    <DollarSign className="w-4 h-4 mr-3" />
                    Wallet
                  </Link>
                </Button>
              </div>
            </div>

            {/* Earnings Widget */}
            <EarningsWidget />
          </div>
        </div>
      </div>
    </Layout>
  );
}
