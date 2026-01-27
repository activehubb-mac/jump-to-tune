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
import { Lock, Loader2, AlertCircle, Save, Rocket, UserCircle, Disc3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useTrackUpload } from "@/hooks/useTrackUpload";
import { AudioUpload } from "@/components/upload/AudioUpload";
import { CoverArtUpload } from "@/components/upload/CoverArtUpload";
import { KaraokeSection } from "@/components/upload/KaraokeSection";
import { KaraokePreviewModal } from "@/components/upload/KaraokePreviewModal";
import { ArtistSelector } from "@/components/upload/ArtistSelector";
import { InfoTooltip } from "@/components/upload/InfoTooltip";
import MoodTagsInput from "@/components/upload/MoodTagsInput";
import CreditsSection, { TrackCredits } from "@/components/upload/CreditsSection";
import FeatureArtistsSelector from "@/components/upload/FeatureArtistsSelector";
import RightsConfirmation from "@/components/upload/RightsConfirmation";
import ExplicitToggle from "@/components/upload/ExplicitToggle";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const GENRES = [
  "Electronic",
  "Hip Hop",
  "Pop",
  "R&B",
  "Rock",
  "Jazz",
  "Classical",
  "Country",
  "Reggae",
  "Latin",
  "Afrobeat",
  "Indie",
  "Alternative",
  "Dance",
  "House",
  "Techno",
  "Ambient",
  "Soul",
  "Folk",
  "Metal",
] as const;

const uploadFormSchema = z.object({
  title: z.string().min(1, "Track title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  genre: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  totalEditions: z.coerce.number().min(1, "At least 1 edition required").max(10000, "Maximum 10,000 editions"),
  artistId: z.string().optional(),
  previewDuration: z.coerce.number().min(15).max(60).default(30),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

interface FeatureArtist {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function Upload() {
  const navigate = useNavigate();
  const { user, role, profile, isLoading } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { isUploading, uploadProgress, uploadTrack } = useTrackUpload();

  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Karaoke states
  const [karaokeEnabled, setKaraokeEnabled] = useState(false);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [showKaraokePreview, setShowKaraokePreview] = useState(false);

  // New fields
  const [moods, setMoods] = useState<string[]>([]);
  const [isExplicit, setIsExplicit] = useState(false);
  const [featureArtists, setFeatureArtists] = useState<FeatureArtist[]>([]);
  const [credits, setCredits] = useState<TrackCredits>({
    writers: [],
    composers: [],
    producers: [],
    engineers: [],
    displayLabelName: "",
  });
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [rightsError, setRightsError] = useState<string | undefined>();

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

    // Only require rights confirmation for publishing
    if (!isDraft && !rightsConfirmed) {
      setRightsError("You must confirm you have the rights to publish this music");
      return;
    }
    setRightsError(undefined);

    const result = await uploadTrack(
      {
        title: values.title,
        description: values.description || "",
        genre: values.genre || "",
        price: values.price,
        totalEditions: values.totalEditions,
        artistId: values.artistId,
        moods,
        isExplicit,
        displayLabelName: credits.displayLabelName || undefined,
        previewDuration: values.previewDuration,
      },
      audioFile,
      coverFile,
      {
        enabled: karaokeEnabled,
        instrumentalFile,
        lyrics,
      },
      {
        writers: credits.writers,
        composers: credits.composers,
        producers: credits.producers,
        engineers: credits.engineers,
      },
      featureArtists.map((a) => a.id),
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
      navigate(role === "artist" ? "/artist/dashboard" : "/label/dashboard");
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
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 overflow-x-hidden box-border">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">Upload Track</h1>
            <Button variant="outline" asChild className="border-glass-border w-full sm:w-auto">
              <Link to="/upload/album">
                <Disc3 className="w-4 h-4 mr-2" />
                Upload Album/EP
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">Share your music with the world</p>
        </div>

        <Form {...form}>
          <form className="space-y-8">
            {/* Artist Selector for Labels */}
            {role === "label" && (
              <div className="glass-card p-4 sm:p-6">
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
            <div className="glass-card p-4 sm:p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Track Details</h2>

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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isUploading}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-muted/50 border-glass-border focus:border-primary">
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border-glass-border">
                          {GENRES.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Feature Artists */}
              <FeatureArtistsSelector
                selectedArtists={featureArtists}
                onChange={setFeatureArtists}
                excludeArtistId={form.watch("artistId") || user?.id}
              />

              {/* Moods */}
              <MoodTagsInput moods={moods} onChange={setMoods} />

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

              {/* Explicit Toggle */}
              <ExplicitToggle isExplicit={isExplicit} onChange={setIsExplicit} />
            </div>

            {/* Credits Section */}
            <CreditsSection credits={credits} onChange={setCredits} />

            {/* Pricing */}
            <div className="glass-card p-4 sm:p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Pricing & Access</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Price (USD) *
                        <InfoTooltip content="Set your price in USD. Consider your audience and the value of limited editions. Free tracks ($0) can help build your following." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.99"
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

              {/* Preview Duration */}
              <FormField
                control={form.control}
                name="previewDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Preview Duration
                      <InfoTooltip content="How much of your track fans can sample before purchasing. Shorter previews create urgency, longer previews let fans appreciate more of the music." />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={String(field.value || 30)}
                      disabled={isUploading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 border-glass-border focus:border-primary">
                          <SelectValue placeholder="Select preview duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds (default)</SelectItem>
                        <SelectItem value="45">45 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              onPreview={audioFile && karaokeEnabled && lyrics.trim() ? () => setShowKaraokePreview(true) : undefined}
            />

            {/* Karaoke Preview Modal */}
            {audioFile && (
              <KaraokePreviewModal
                open={showKaraokePreview}
                onOpenChange={setShowKaraokePreview}
                audioFile={audioFile}
                instrumentalFile={instrumentalFile}
                lyrics={lyrics}
                trackTitle={form.watch("title") || "Untitled Track"}
              />
            )}

            {/* Rights Confirmation */}
            <RightsConfirmation
              checked={rightsConfirmed}
              onChange={setRightsConfirmed}
              error={rightsError}
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
