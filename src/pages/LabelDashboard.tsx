import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Building2, Users, Music, Upload, DollarSign, TrendingUp, Plus, Lock, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function LabelDashboard() {
  const isLoggedIn = false; // Will be replaced with actual auth state
  const isLabel = false; // Will check role

  if (!isLoggedIn) {
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Label Dashboard</h1>
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
            <div className="text-3xl font-bold text-foreground">8/10</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Tracks</span>
            </div>
            <div className="text-3xl font-bold text-foreground">156</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-foreground">15.2 ETH</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-muted-foreground text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-foreground">+24%</div>
          </div>
        </div>

        {/* Artists Roster */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Artist Roster</h2>
            <span className="text-sm text-muted-foreground">8 of 10 slots used</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center mb-3">
                  <Music className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="font-medium text-foreground">Artist {i + 1}</h3>
                <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 20) + 5} tracks</p>
              </div>
            ))}
            {/* Add Artist Slot */}
            <button className="p-4 rounded-lg border-2 border-dashed border-glass-border hover:border-accent/50 transition-colors text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <Plus className="w-7 h-7 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Add Artist</span>
            </button>
          </div>
        </div>

        {/* Recent Releases */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Releases</h2>
            <Button variant="ghost" size="sm" className="text-accent">View All</Button>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Music className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">Track Name #{i + 1}</h3>
                  <p className="text-sm text-muted-foreground">by Artist {(i % 8) + 1}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">0.05 ETH</div>
                  <div className="text-xs text-muted-foreground">{(i + 1) * 3} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
