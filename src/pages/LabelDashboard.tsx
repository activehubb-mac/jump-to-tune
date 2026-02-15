import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  X,
  Trash2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLabelStats } from "@/hooks/useLabelStats";
import { supabase } from "@/integrations/supabase/client";
import { useLabelTracks } from "@/hooks/useTracks";
import { useLabelRoster } from "@/hooks/useLabelRoster";
import { useLabelRosterActions } from "@/hooks/useLabelRosterActions";
import { formatEarnings } from "@/lib/formatters";
import { TrackCard } from "@/components/dashboard/TrackCard";
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";
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
import { useQueryClient } from "@tanstack/react-query";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";
import { EarningsWidget } from "@/components/dashboard/EarningsWidget";
import { AddArtistModal } from "@/components/label/AddArtistModal";
import { UpgradePlanModal } from "@/components/label/UpgradePlanModal";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { formatEarnings as formatEarningsDollars } from "@/lib/formatters";

export default function LabelDashboard() {
  const { user, role, profile, isLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useLabelStats(user?.id);
  const { data: tracks, isLoading: tracksLoading } = useLabelTracks(user?.id);
  const { data: roster, isLoading: rosterLoading } = useLabelRoster(user?.id);
  const { activeArtistCount, canAddMoreArtists, artistLimit, removeArtist } = useLabelRosterActions();
  const { showFeedback } = useFeedbackSafe();
  const navigate = useNavigate();
  const {
    isConnected,
    accountStatus,
    pendingEarningsDollars,
    totalEarningsDollars,
    isLoading: stripeLoading,
    startOnboarding,
    isConnecting,
  } = useStripeConnect();
  
  const [showAddArtistModal, setShowAddArtistModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDeleteTrack = async () => {
    if (!deleteTrackId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("tracks").delete().eq("id", deleteTrackId);
      if (error) throw error;
      showFeedback({ type: "success", title: "Track Deleted", message: "Track deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["label-stats"] });
    } catch (error) {
      console.error("Error deleting track:", error);
      showFeedback({ type: "error", title: "Delete Failed", message: "Failed to delete track" });
    } finally {
      setIsDeleting(false);
      setDeleteTrackId(null);
    }
  };

  const handleAddArtistClick = () => {
    if (!canAddMoreArtists) {
      setShowUpgradeModal(true);
    } else {
      setShowAddArtistModal(true);
    }
  };

  const handleRemoveArtist = async (rosterId: string, artistName: string) => {
    try {
      await removeArtist.mutateAsync(rosterId);
      showFeedback({
        type: "success",
        title: "Artist Removed",
        message: `${artistName || "Artist"} has been removed from your roster.`,
        autoClose: true,
      });
    } catch (error) {
      console.error("Failed to remove artist:", error);
      showFeedback({
        type: "error",
        title: "Failed",
        message: "Could not remove artist. Please try again.",
        autoClose: true,
      });
    }
  };

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
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Subscription Status Banner */}
        <SubscriptionStatusBanner className="mb-4 sm:mb-6" />

        {/* Mobile Earnings/Withdrawal Banner - only visible below lg */}
        <div className="lg:hidden mb-4 sm:mb-6">
          {stripeLoading ? (
            <div className="glass-card p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : !isConnected ? (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">Set Up Withdrawals</h3>
                    <p className="text-xs text-muted-foreground truncate">Connect to receive earnings</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-accent hover:bg-accent/90 shrink-0"
                  onClick={startOnboarding}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Set Up
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : accountStatus === "pending" ? (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">Complete Setup</h3>
                    <p className="text-xs text-muted-foreground truncate">Finish Stripe onboarding</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 shrink-0"
                  onClick={startOnboarding}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Link to="/label/payouts" className="glass-card p-4 block hover:border-accent/50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Pending:</span>
                      <span className="font-semibold text-foreground">{formatEarningsDollars(pendingEarningsDollars)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">All Time:</span>
                      <span className="text-sm text-foreground">{formatEarningsDollars(totalEarningsDollars)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-accent shrink-0">
                  <span className="text-sm font-medium">Payouts</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2 truncate">
              {profile?.display_name ? `${profile.display_name}` : "Label Dashboard"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your artists and releases</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="border-glass-border hover:border-accent/50 flex-1 sm:flex-none text-xs sm:text-sm"
              onClick={handleAddArtistClick}
            >
              <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Artist</span>
              <span className="sm:hidden">Add</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                {activeArtistCount}/{artistLimit}
              </Badge>
            </Button>
            <Button className="bg-accent hover:bg-accent/90 neon-glow-subtle flex-1 sm:flex-none text-xs sm:text-sm" asChild>
              <Link to="/upload">
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Upload Track</span>
                <span className="sm:hidden">Upload</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Stats Grid - Clickable */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div className="glass-card p-3 sm:p-6 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Artists</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-foreground">
                  {isDataLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : `${activeArtistCount}/${artistLimit}`}
                </div>
              </div>

              <Link 
                to="/label/tracks"
                className="glass-card p-3 sm:p-6 hover:border-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Tracks</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
                <div className="text-xl sm:text-3xl font-bold text-foreground">
                  {isDataLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : stats?.totalTracks ?? 0}
                </div>
              </Link>

              <Link 
                to="/label/analytics"
                className="glass-card p-3 sm:p-6 hover:border-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Earnings</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
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
                to="/label/collectors"
                className="glass-card p-3 sm:p-6 hover:border-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Collectors</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
                <div className="text-xl sm:text-3xl font-bold text-foreground">
                  {isDataLoading ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    stats?.collectorsCount ?? 0
                  )}
                </div>
              </Link>
            </div>

            {/* Artists Roster */}
            <div className="glass-card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Artist Roster</h2>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {activeArtistCount} of {artistLimit} artists
                </span>
              </div>
              
              {rosterLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : roster && roster.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {roster.map((artist) => (
                    <div key={artist.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                        {artist.artist?.avatar_url ? (
                          <img
                            src={artist.artist.avatar_url}
                            alt={artist.artist.display_name || "Artist"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Music className="w-6 h-6 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {artist.artist?.display_name || "Unknown Artist"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{artist.trackCount} tracks</span>
                          <Badge 
                            variant={artist.status === "active" ? "default" : "secondary"}
                            className={artist.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : ""}
                          >
                            {artist.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveArtist(artist.id, artist.artist?.display_name || "")}
                        disabled={removeArtist.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't added any artists to your roster yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-glass-border hover:border-accent/50"
                    onClick={handleAddArtistClick}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Artist
                  </Button>
                </div>
              )}
            </div>

            {/* Recent Releases */}
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Recent Releases</h2>
                {tracks && tracks.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-accent text-xs sm:text-sm" asChild>
                    <Link to="/label/tracks">View All</Link>
                  </Button>
                )}
              </div>
              
              {tracksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : tracks && tracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {tracks.slice(0, 6).map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      showArtist
                      showActions
                      onEdit={(id) => navigate(`/track/${id}/edit`)}
                      onDelete={(id) => setDeleteTrackId(id)}
                      onClick={() => setSelectedTrack(track)}
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
          <div className="space-y-4 sm:space-y-6 hidden lg:block">
            {/* Quick Actions */}
            <div className="glass-card p-4 sm:p-6">
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

      {/* Add Artist Modal */}
      <AddArtistModal
        open={showAddArtistModal}
        onOpenChange={setShowAddArtistModal}
      />

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentCount={activeArtistCount}
        limit={artistLimit}
      />

      {/* Track Detail Modal */}
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
              onClick={handleDeleteTrack}
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
    </Layout>
  );
}
