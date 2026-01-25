import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Music,
  Plus,
  Loader2,
  Lock,
  AlertCircle,
  Trash2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistTracks } from "@/hooks/useTracks";
import { TrackCard } from "@/components/dashboard/TrackCard";
import { TrackDetailModal } from "@/components/dashboard/TrackDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
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

export default function ArtistTracks() {
  const { user, role, isLoading } = useAuth();
  const { data: tracks, isLoading: tracksLoading } = useArtistTracks(user?.id);
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<typeof tracks extends (infer T)[] ? T : never | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showFeedback } = useFeedbackSafe();

  const handleDelete = async () => {
    if (!deleteTrackId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", deleteTrackId);

      if (error) throw error;

      showFeedback({ type: "success", title: "Track Deleted", message: "Track deleted successfully" });
      // Fix: Use correct query keys that match useTracks hook
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
    } catch (error) {
      console.error("Error deleting track:", error);
      showFeedback({ type: "error", title: "Delete Failed", message: "Failed to delete track" });
    } finally {
      setIsDeleting(false);
      setDeleteTrackId(null);
    }
  };

  const handleEdit = (trackId: string) => {
    navigate(`/track/${trackId}/edit`);
  };

  if (isLoading) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout useBackground="subtle">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Tracks</h1>
            <p className="text-muted-foreground mb-8">Sign in to view your tracks.</p>
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
      <Layout useBackground="subtle">
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

  return (
    <Layout useBackground="subtle">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link to="/artist/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Tracks</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {tracks?.length ?? 0} track{(tracks?.length ?? 0) !== 1 ? "s" : ""} uploaded
              </p>
            </div>
          </div>
          <Button className="gradient-accent neon-glow-subtle w-full sm:w-auto" asChild>
            <Link to="/upload">
              <Plus className="w-4 h-4 mr-2" />
              Upload New
            </Link>
          </Button>
        </div>

        {tracksLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tracks.map((track) => (
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
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Tracks Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your first track to start building your catalog and earning from your music.
            </p>
            <Button className="gradient-accent" asChild>
              <Link to="/upload">
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Track
              </Link>
            </Button>
          </div>
        )}
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
    </Layout>
  );
}
