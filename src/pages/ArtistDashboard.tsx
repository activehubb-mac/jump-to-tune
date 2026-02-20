import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Music, Upload, DollarSign, Users, TrendingUp, BarChart3, Plus, Lock, AlertCircle, Loader2, Trash2, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistStats } from "@/hooks/useArtistStats";
import { useArtistTracks } from "@/hooks/useTracks";
import { formatEarnings } from "@/lib/formatters";
import { TrackCard } from "@/components/dashboard/TrackCard";
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";
import { EarningsWidget } from "@/components/dashboard/EarningsWidget";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";
import { LabelInvitesSection } from "@/components/artist/LabelInvitesSection";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useLowBalanceNotification } from "@/hooks/useLowBalanceNotification";
import { useWallet } from "@/hooks/useWallet";
import { LowBalanceWarningModal } from "@/components/wallet/LowBalanceWarningModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Show max 6 tracks on dashboard, more leads to "View All" page
const MAX_DASHBOARD_TRACKS = 6;

export default function ArtistDashboard() {
  const { user, role, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useArtistStats(user?.id);
  const { data: tracks, isLoading: tracksLoading } = useArtistTracks(user?.id);
  const { showFeedback } = useFeedbackSafe();
  const { showLowBalanceWarning, setShowLowBalanceWarning, lowBalanceWarningData } = useWallet();
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<typeof tracks extends (infer T)[] ? T : never | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Enable low balance notifications for artists
  useLowBalanceNotification();

  const handleDelete = async () => {
    if (!deleteTrackId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", deleteTrackId);

      if (error) throw error;

      showFeedback({
        type: "success",
        title: "Track Deleted",
        message: "Your track has been successfully removed.",
        autoClose: true,
      });
      // Fix: Use correct query keys that match useTracks hook
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    } catch (error) {
      console.error("Error deleting track:", error);
      showFeedback({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete track. Please try again.",
        autoClose: true,
      });
    } finally {
      setIsDeleting(false);
      setDeleteTrackId(null);
    }
  };

  const handleEdit = (trackId: string) => {
    navigate(`/track/${trackId}/edit`);
  };

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
  const displayTracks = tracks?.slice(0, MAX_DASHBOARD_TRACKS) ?? [];
  const hasMoreTracks = (tracks?.length ?? 0) > MAX_DASHBOARD_TRACKS;

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden box-border">
        {/* Subscription Status Banner */}
        <SubscriptionStatusBanner className="mb-4 sm:mb-6" />

        {/* Label Invitations Section */}
        <LabelInvitesSection />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2 truncate">
              {profile?.display_name ? `Welcome, ${profile.display_name}` : "Artist Dashboard"}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Manage your music and track your earnings</p>
          </div>
          <Button className="gradient-accent neon-glow-subtle hover:neon-glow w-full sm:w-auto text-sm" asChild>
            <Link to="/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Track
            </Link>
          </Button>
        </div>

        {/* Stats Grid - Clickable Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link 
            to="/artist/tracks" 
            className="glass-card p-3 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-sm">Total Tracks</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold text-foreground">
              {isDataLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : stats?.totalTracks ?? 0}
            </div>
          </Link>

          <Link 
            to="/artist/analytics" 
            className="glass-card p-3 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-sm">Earnings</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold text-foreground">
              {isDataLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                formatEarnings(stats?.totalEarnings ?? 0)
              )}
            </div>
          </Link>

          <Link 
            to="/artist/collectors" 
            className="glass-card p-3 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-sm">Collectors</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold text-foreground">
              {isDataLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : stats?.collectorsCount ?? 0}
            </div>
          </Link>

          <Link 
            to="/artist/analytics" 
            className="glass-card p-3 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <span className="text-muted-foreground text-xs sm:text-sm">This Month</span>
            </div>
            <div className="text-lg sm:text-3xl font-bold text-foreground">
              {isDataLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : stats?.thisMonthSales ? (
                <span className="truncate">{stats.thisMonthSales} sales</span>
              ) : (
                "--"
              )}
            </div>
          </Link>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Tracks */}
          <div className="lg:col-span-2 glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Your Tracks</h2>
              {tracks && tracks.length > 0 && (
                <Button variant="ghost" size="sm" className="text-primary text-xs sm:text-sm" asChild>
                  <Link to="/artist/tracks">
                    View All {hasMoreTracks && `(${tracks.length})`}
                  </Link>
                </Button>
              )}
            </div>
            
            {tracksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : displayTracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                {displayTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    showActions
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteTrackId(id)}
                    onClick={() => setSelectedTrack(track)}
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

          {/* Quick Actions & Earnings */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions - Hidden on mobile, show as horizontal on tablet */}
            <div className="glass-card p-4 sm:p-6 hidden sm:block">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-2 sm:space-y-3">
                <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50 text-sm" asChild>
                  <Link to="/upload">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload New Track
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50 text-sm" asChild>
                  <Link to="/artist/analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50 text-sm" asChild>
                  <Link to="/artist/collectors">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Collectors
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50 text-sm" asChild>
                  <Link to="/wallet">
                    <Wallet className="w-4 h-4 mr-2" />
                    My Wallet
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-glass-border hover:border-primary/50 text-sm" asChild>
                  <Link to="/artist/store">
                    <DollarSign className="w-4 h-4 mr-2" />
                    My Store
                  </Link>
                </Button>
              </div>
            </div>

            {/* Earnings Widget */}
            <EarningsWidget />
          </div>
        </div>
      </div>

      {/* Track Detail Modal with Audio Player */}
      <TrackDetailModal
        track={selectedTrack}
        open={!!selectedTrack}
        onOpenChange={(open) => !open && setSelectedTrack(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTrackId} onOpenChange={() => setDeleteTrackId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Track
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this track? This action cannot be undone.
              All associated data including purchases will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Low Balance Warning Modal */}
      <LowBalanceWarningModal
        open={showLowBalanceWarning}
        onOpenChange={setShowLowBalanceWarning}
        currentBalance={lowBalanceWarningData?.currentBalance ?? 0}
        averagePurchase={lowBalanceWarningData?.averagePurchase}
      />
    </Layout>
  );
}
