import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Building2, Users, Music, Upload, DollarSign, TrendingUp, Plus, Lock, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LabelDashboard() {
  const { user, role, profile, isLoading } = useAuth();

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
              <Link to={role === "artist" ? "/artist-dashboard" : "/browse"}>
                {role === "artist" ? "Go to Artist Dashboard" : "Browse Music"}
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Artists</span>
            </div>
            <div className="text-3xl font-bold text-foreground">0/10</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Tracks</span>
            </div>
            <div className="text-3xl font-bold text-foreground">0</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-foreground">0 ETH</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-muted-foreground text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-foreground">--</div>
          </div>
        </div>

        {/* Artists Roster */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Artist Roster</h2>
            <span className="text-sm text-muted-foreground">0 of 10 slots used</span>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>You haven't added any artists to your roster yet.</p>
            <Button variant="outline" className="mt-4 border-glass-border hover:border-accent/50">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Your First Artist
            </Button>
          </div>
        </div>

        {/* Recent Releases */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Releases</h2>
            <Button variant="ghost" size="sm" className="text-accent">View All</Button>
          </div>
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
        </div>
      </div>
    </Layout>
  );
}