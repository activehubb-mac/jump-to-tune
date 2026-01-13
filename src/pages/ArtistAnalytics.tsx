import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Music, 
  Users, 
  Calendar,
  Loader2,
  Lock,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistStats } from "@/hooks/useArtistStats";
import { useArtistTracks } from "@/hooks/useTracks";
import { formatPrice, formatEarnings } from "@/lib/formatters";

export default function ArtistAnalytics() {
  const { user, role, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useArtistStats(user?.id);
  const { data: tracks, isLoading: tracksLoading } = useArtistTracks(user?.id);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Analytics</h1>
            <p className="text-muted-foreground mb-8">Sign in to view your analytics.</p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/auth?role=artist">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (role !== "artist") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist Access Only</h1>
            <p className="text-muted-foreground mb-8">This page is for artists only.</p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isDataLoading = statsLoading || tracksLoading;

  // Calculate track stats
  const totalEditionsSold = tracks?.reduce((sum, t) => sum + t.editions_sold, 0) ?? 0;
  const totalEditions = tracks?.reduce((sum, t) => sum + t.total_editions, 0) ?? 0;
  const soldPercentage = totalEditions > 0 ? Math.round((totalEditionsSold / totalEditions) * 100) : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/artist/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Track your performance and earnings</p>
          </div>
        </div>

        {isDataLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Total Earnings</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {formatEarnings(stats?.totalEarnings ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">85% of sales after platform fee</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-muted-foreground text-sm">This Month</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {formatEarnings(stats?.thisMonthEarnings ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.thisMonthSales ?? 0} sale{(stats?.thisMonthSales ?? 0) !== 1 ? "s" : ""} this month
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-muted-foreground text-sm">Collectors</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {stats?.collectorsCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unique buyers of your music</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Music className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Editions Sold</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {totalEditionsSold}/{totalEditions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{soldPercentage}% of editions sold</p>
              </div>
            </div>

            {/* Track Performance */}
            <div className="glass-card p-6 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Track Performance</h2>
              {tracks && tracks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-muted-foreground text-sm border-b border-glass-border">
                        <th className="pb-3 font-medium">Track</th>
                        <th className="pb-3 font-medium">Price</th>
                        <th className="pb-3 font-medium">Editions Sold</th>
                        <th className="pb-3 font-medium">Revenue</th>
                        <th className="pb-3 font-medium">Your Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track) => {
                        const revenue = track.price * track.editions_sold;
                        return (
                          <tr key={track.id} className="border-b border-glass-border/50">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {track.cover_art_url ? (
                                  <img 
                                    src={track.cover_art_url} 
                                    alt={track.title}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-foreground">{track.title}</p>
                                  <p className="text-xs text-muted-foreground">{track.genre || "No genre"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-foreground">{formatPrice(track.price)}</td>
                            <td className="py-4 text-foreground">
                              {track.editions_sold}/{track.total_editions}
                            </td>
                            <td className="py-4 text-foreground">{formatPrice(revenue)}</td>
                            <td className="py-4 text-primary font-medium">
                              {formatEarnings(revenue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tracks uploaded yet. Upload your first track to see analytics!</p>
                  <Button className="mt-4 gradient-accent" asChild>
                    <Link to="/upload">Upload Track</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Revenue Breakdown */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Revenue Breakdown</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/20">
                  <p className="text-muted-foreground text-sm mb-2">Total Sales</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPrice(stats?.totalEarnings ?? 0)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10">
                  <p className="text-muted-foreground text-sm mb-2">Platform Fee (15%)</p>
                  <p className="text-2xl font-bold text-destructive">
                    -{formatPrice((stats?.totalEarnings ?? 0) * 0.15)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/20">
                  <p className="text-muted-foreground text-sm mb-2">Your Earnings (85%)</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatEarnings(stats?.totalEarnings ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
