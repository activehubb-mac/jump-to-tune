import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Disc3, Upload, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

const GENRES = [
  "Hip Hop",
  "R&B",
  "Pop",
  "Electronic",
  "Rock",
  "Jazz",
  "Classical",
  "Country",
  "Reggae",
  "Latin",
  "Other",
];

export default function TrackEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedbackSafe();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("");
  const [totalEditions, setTotalEditions] = useState("");
  const [isDraft, setIsDraft] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Fetch track data
  const { data: track, isLoading: trackLoading } = useQuery({
    queryKey: ["track", id],
    queryFn: async () => {
      if (!id) throw new Error("No track ID");
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Track not found");
      return data;
    },
    enabled: !!id,
  });

  // Populate form when track loads
  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setDescription(track.description || "");
      setGenre(track.genre || "");
      setPrice(track.price.toString());
      setTotalEditions(track.total_editions.toString());
      setIsDraft(track.is_draft ?? true);
      setCoverPreview(track.cover_art_url);
    }
  }, [track]);

  // Handle cover image change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error("Missing data");

      let coverUrl = track?.cover_art_url;

      // Upload new cover if changed
      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop();
        const fileName = `${user.id}/${id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(fileName, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("covers")
          .getPublicUrl(fileName);

        coverUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("tracks")
        .update({
          title,
          description: description || null,
          genre: genre || null,
          price: parseFloat(price) || 0,
          total_editions: parseInt(totalEditions) || 100,
          is_draft: isDraft,
          cover_art_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      showFeedback({ type: "success", title: "Track Updated", message: "Track updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["track", id] });
      queryClient.invalidateQueries({ queryKey: ["artist-stats"] });
      navigate("/artist/tracks");
    },
    onError: (error) => {
      console.error("Error updating track:", error);
      showFeedback({ type: "error", title: "Update Failed", message: "Failed to update track" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showFeedback({ type: "error", title: "Validation Error", message: "Title is required" });
      return;
    }
    saveMutation.mutate();
  };

  // Auth loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Edit Track</h1>
            <p className="text-muted-foreground mb-8">Sign in to edit your tracks.</p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/auth?role=artist">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Not an artist
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

  // Check ownership
  if (track && track.artist_id !== user.id) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-8">You can only edit your own tracks.</p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/artist/tracks">Back to Your Tracks</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading track
  if (trackLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/artist/tracks">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Track</h1>
            <p className="text-muted-foreground">Update your track details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Art */}
          <div className="glass-card p-6">
            <Label className="text-base font-semibold mb-4 block">Cover Art</Label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted/50 relative flex-shrink-0">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Disc3 className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="cover"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("cover")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Cover
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: Square image, at least 500x500px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="glass-card p-6 space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell listeners about this track..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="glass-card p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="9.99"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editions">Total Editions</Label>
                <Input
                  id="editions"
                  type="number"
                  min="1"
                  value={totalEditions}
                  onChange={(e) => setTotalEditions(e.target.value)}
                  placeholder="100"
                  className="mt-1"
                />
                {track && track.editions_sold > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {track.editions_sold} already sold
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Publish Status */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="draft" className="text-base font-semibold">
                  Publish Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isDraft
                    ? "Draft - Only visible to you"
                    : "Published - Visible to everyone"}
                </p>
              </div>
              <Switch
                id="draft"
                checked={!isDraft}
                onCheckedChange={(checked) => setIsDraft(!checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/artist/tracks")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-accent neon-glow-subtle"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
