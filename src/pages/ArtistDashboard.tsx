import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Music, Upload, DollarSign, Users, TrendingUp, BarChart3, Plus, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function ArtistDashboard() {
  const isLoggedIn = false; // Will be replaced with actual auth state
  const isArtist = false; // Will check role

  if (!isLoggedIn) {
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Artist Dashboard</h1>
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
            <div className="text-3xl font-bold text-foreground">24</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-muted-foreground text-sm">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-foreground">2.5 ETH</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Collectors</span>
            </div>
            <div className="text-3xl font-bold text-foreground">156</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-muted-foreground text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-foreground">+12%</div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Tracks */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Your Tracks</h2>
              <Button variant="ghost" size="sm" className="text-primary">View All</Button>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">Track Name #{i + 1}</h3>
                    <p className="text-sm text-muted-foreground">{50 - i * 5}/100 remaining</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">0.05 ETH</div>
                    <div className="text-xs text-muted-foreground">{i + 1} sold</div>
                  </div>
                </div>
              ))}
            </div>
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
