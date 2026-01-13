import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, Lock, Loader2, AlertCircle, Save, Rocket, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useTrackUpload } from "@/hooks/useTrackUpload";
import { AudioUpload } from "@/components/upload/AudioUpload";
import { CoverArtUpload } from "@/components/upload/CoverArtUpload";
import { KaraokeSection } from "@/components/upload/KaraokeSection";
import { ArtistSelector } from "@/components/upload/ArtistSelector";
import { InfoTooltip } from "@/components/upload/InfoTooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const uploadFormSchema = z.object({
  title: z.string().min(1, "Track title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  genre: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  totalEditions: z.coerce.number().min(1, "At least 1 edition required").max(10000, "Maximum 10,000 editions"),
  artistId: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export default function Upload() {
  const navigate = useNavigate();
  const { user, role, profile, isLoading } = useAuth();
  const { showFeedback } = useFeedback();
  const { isUploading, uploadProgress, uploadTrack } = useTrackUpload();

  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Karaoke states
  const [karaokeEnabled, setKaraokeEnabled] = useState(false);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      price: 0,
      totalEditions: 100,
      artistId: undefined,
    },
  });

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
            <h1 className="text-3xl font-bold text-foreground mb-4">Upload Music</h1>
            <p className="text-muted-foreground mb-8">
              Sign in as an artist or label to upload your music.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="gradient-accent neon-glow-subtle" asChild>
                <Link to="/auth?role=artist">Sign In as Artist</Link>
              </Button>
              <Button variant="outline" className="border-glass-border" asChild>
                <Link to="/auth?role=label">Sign In as Label</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Logged in but not an artist or label - show access denied
  if (role !== "artist" && role !== "label") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist or Label Access Only</h1>
            <p className="text-muted-foreground mb-8">
              Only artists and labels can upload music. Browse our collection instead!
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Profile not completed - prompt to complete onboarding
  if (!profile?.onboarding_completed) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Complete Your Profile</h1>
            <p className="text-muted-foreground mb-8">
              Set up your {role === "label" ? "label" : "artist"} profile before uploading tracks.
              This helps fans discover and connect with you.
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/onboarding">Complete Profile Setup</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAudioChange = (file: File | null, duration?: number) => {
    setAudioFile(file);
    setAudioDuration(duration ?? null);
  };

  const onSubmit = async (values: UploadFormValues, isDraft: boolean) => {
    if (!audioFile) {
      showFeedback({
        type: "error",
        title: "Audio Required",
        message: "Please upload an audio file for your track.",
      });
      return;
    }

    const result = await uploadTrack(
      {
        title: values.title,
        description: values.description || "",
        genre: values.genre || "",
        price: values.price,
        totalEditions: values.totalEditions,
        artistId: values.artistId,
      },
      audioFile,
      coverFile,
      {
        enabled: karaokeEnabled,
        instrumentalFile,
        lyrics,
      },
      isDraft
    );

    if (result.success) {
      showFeedback({
        type: "success",
        title: isDraft ? "Draft Saved" : "Track Published!",
        message: isDraft
          ? "Your track has been saved as a draft. You can publish it later from your dashboard."
          : "Your track is now live and visible to fans!",
      });
      navigate(role === "artist" ? "/artist-dashboard" : "/label-dashboard");
    } else {
      showFeedback({
        type: "error",
        title: "Upload Failed",
        message: result.error || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Upload Track</h1>
          <p className="text-muted-foreground">Share your music with the world</p>
        </div>

        <Form {...form}>
          <form className="space-y-8">
            {/* Artist Selector for Labels */}
            {role === "label" && (
              <div className="glass-card p-6">
                <ArtistSelector
                  value={form.watch("artistId")}
                  onChange={(artistId) => form.setValue("artistId", artistId)}
                  disabled={isUploading}
                />
              </div>
            )}

            {/* Audio Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-foreground">Audio File *</Label>
                <InfoTooltip content="High-quality audio recommended. MP3 (320kbps), WAV, or FLAC. Your original file is securely stored and never compressed." />
              </div>
              <AudioUpload
                value={audioFile}
                onChange={handleAudioChange}
                uploadProgress={uploadProgress.audio}
                disabled={isUploading}
              />
            </div>

            {/* Cover Art */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-foreground">Cover Art</Label>
                <InfoTooltip content="Eye-catching artwork helps your track stand out. Use a 1:1 square image (1400x1400px recommended) for best quality across all devices." />
              </div>
              <CoverArtUpload
                value={coverFile}
                onChange={setCoverFile}
                uploadProgress={uploadProgress.cover}
                disabled={isUploading}
              />
            </div>

            {/* Track Details */}
            <div className="glass-card p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Track Title *
                        <InfoTooltip content="Choose a memorable title. This is what fans will see when browsing and what they'll search for." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter track title"
                          className="bg-muted/50 border-glass-border focus:border-primary"
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Genre
                        <InfoTooltip content="Select a genre that best represents your sound. This helps fans discover your music through browse filters." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Electronic, Hip Hop"
                          className="bg-muted/50 border-glass-border focus:border-primary"
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Description
                      <InfoTooltip content="Share the story behind your track. What inspired it? What should listeners know? Great descriptions increase engagement." />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell listeners about this track..."
                        className="bg-muted/50 border-glass-border focus:border-primary min-h-24 resize-none"
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pricing */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Price (ETH) *
                        <InfoTooltip content="Set your price in ETH. Consider your audience and the value of limited editions. Free tracks (0 ETH) can help build your following." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0.05"
                          className="bg-muted/50 border-glass-border focus:border-primary"
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalEditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Number of Editions *
                        <InfoTooltip content="Limited editions create scarcity and value. Once sold out, fans can only buy from other collectors. Lower numbers = higher exclusivity." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="10000"
                          placeholder="100"
                          className="bg-muted/50 border-glass-border focus:border-primary"
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Karaoke Section */}
            <KaraokeSection
              enabled={karaokeEnabled}
              onEnabledChange={setKaraokeEnabled}
              instrumentalFile={instrumentalFile}
              onInstrumentalChange={setInstrumentalFile}
              lyrics={lyrics}
              onLyricsChange={setLyrics}
              disabled={isUploading}
            />

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-glass-border"
                disabled={isUploading}
                onClick={form.handleSubmit((values) => onSubmit(values, true))}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                type="button"
                className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
                disabled={isUploading}
                onClick={form.handleSubmit((values) => onSubmit(values, false))}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                Publish Track
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
