import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Lock,
  AlertCircle,
  Loader2,
  Music,
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLabelRoster } from "@/hooks/useLabelRoster";
import { useLabelRosterActions } from "@/hooks/useLabelRosterActions";
import { AddArtistModal } from "@/components/label/AddArtistModal";
import { UpgradePlanModal } from "@/components/label/UpgradePlanModal";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export default function LabelRoster() {
  const { user, role, isLoading } = useAuth();
  const { data: roster, isLoading: rosterLoading } = useLabelRoster(user?.id);
  const { activeArtistCount, canAddMoreArtists, artistLimit, removeArtist } = useLabelRosterActions();
  const { showFeedback } = useFeedbackSafe();

  const [showAddArtistModal, setShowAddArtistModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  // Loading state
  if (isLoading) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist Roster</h1>
            <p className="text-muted-foreground mb-8">
              Sign in to manage your artist roster.
            </p>
            <Button className="bg-accent hover:bg-accent/90 neon-glow-subtle" asChild>
              <Link to="/auth?role=label">Sign In as Label</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Not a label
  if (role !== "label") {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Label Access Only</h1>
            <p className="text-muted-foreground mb-8">
              This page is for labels only.
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

  const filteredRoster = roster?.filter((artist) => {
    if (filterStatus === "all") return true;
    return artist.status === filterStatus;
  }) ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "removed":
      case "declined":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/label/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Artist Roster</h1>
              <p className="text-muted-foreground">
                Manage the artists signed to your label
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {activeArtistCount} / {artistLimit} artists with uploads
              </Badge>
              <Button onClick={handleAddArtistClick} className="bg-accent hover:bg-accent/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Artist
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "active", "pending"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? "bg-accent hover:bg-accent/90" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Roster List */}
        {rosterLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredRoster.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoster.map((artist) => (
              <div
                key={artist.id}
                className="glass-card p-4 hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={artist.artist?.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent/20 text-accent">
                      {artist.artist?.display_name?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {artist.artist?.display_name || "Unknown Artist"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={getStatusVariant(artist.status) as "default" | "secondary" | "outline"}
                        className={`gap-1 ${
                          artist.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                            : artist.status === "active"
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : ""
                        }`}
                      >
                        {getStatusIcon(artist.status)}
                        {artist.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {artist.trackCount} tracks
                      </span>
                    </div>
                  </div>
                  {(artist.status === "active" || artist.status === "pending") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveArtist(artist.id, artist.artist?.display_name || "")}
                      disabled={removeArtist.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filterStatus === "all" ? "No Artists Yet" : `No ${filterStatus} Artists`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {filterStatus === "all"
                ? "Start building your roster by inviting artists to join your label."
                : `You don't have any artists with ${filterStatus} status.`}
            </p>
            {filterStatus === "all" && (
              <Button onClick={handleAddArtistClick} className="bg-accent hover:bg-accent/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Your First Artist
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddArtistModal open={showAddArtistModal} onOpenChange={setShowAddArtistModal} />
      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentCount={activeArtistCount}
        limit={artistLimit}
      />
    </Layout>
  );
}
