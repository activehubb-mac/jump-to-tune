import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Lock, Loader2, AlertCircle, Save, Rocket, UserCircle, Music, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAlbumUpload } from "@/hooks/useAlbumUpload";
import { ReleaseTypeSelector, ReleaseType } from "@/components/upload/ReleaseTypeSelector";
import { AlbumCoverUpload } from "@/components/upload/AlbumCoverUpload";
import { BulkAudioUpload, AudioTrackFile } from "@/components/upload/BulkAudioUpload";
import { AlbumTrackList } from "@/components/upload/AlbumTrackList";
import { AlbumTrackData } from "@/components/upload/AlbumTrackRow";
import { ArtistSelector } from "@/components/upload/ArtistSelector";
import { InfoTooltip } from "@/components/upload/InfoTooltip";
import RightsConfirmation from "@/components/upload/RightsConfirmation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { MAIN_GENRES, getSubGenres, hasSubGenres, combineGenreValue } from "@/lib/genres";

const albumFormSchema = z.object({
  title: z.string().min(1, "Album title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  genre: z.string().optional(),
  artistId: z.string().optional(),
});

type AlbumFormValues = z.infer<typeof albumFormSchema>;

const RELEASE_TYPE_CONSTRAINTS: Record<ReleaseType, { min: number; max: number }> = {
  single: { min: 1, max: 3 },
  ep: { min: 4, max: 6 },
  album: { min: 7, max: 20 },
};

export default function AlbumUpload() {
  const navigate = useNavigate();
  const { user, role, profile, isLoading } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const { isUploading, uploadProgress, uploadAlbum } = useAlbumUpload();

  // Release type
  const [releaseType, setReleaseType] = useState<ReleaseType>('album');
  
  // Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<AlbumTrackData[]>([]);
  
  // Rights
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [rightsError, setRightsError] = useState<string | undefined>();

  // Sub-genre state
  const [subGenre, setSubGenre] = useState("");
  const selectedMainGenre = form.watch("genre") || "";
  const availableSubGenres = getSubGenres(selectedMainGenre);
  const showSubGenreDropdown = hasSubGenres(selectedMainGenre);

  const form = useForm<AlbumFormValues>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      artistId: undefined,
    },
  });

  // Convert bulk audio files to album track data
  const handleBulkAudioChange = (audioTracks: AudioTrackFile[]) => {
    const albumTracks: AlbumTrackData[] = audioTracks.map(t => ({
      id: t.id,
      file: t.file,
      duration: t.duration,
      title: t.title,
      trackNumber: t.trackNumber,
      price: 0.99, // Default price
      hasKaraoke: false,
      lyrics: '',
      featureArtists: [],
      credits: {
        writers: [],
        composers: [],
        producers: [],
        engineers: [],
        displayLabelName: '',
      },
      moods: [],
      isExplicit: false,
    }));
    setTracks(albumTracks);
  };

  // Get constraints for current release type
  const constraints = RELEASE_TYPE_CONSTRAINTS[releaseType];
  
  // Validation state
  const trackCountValid = tracks.length >= constraints.min && tracks.length <= constraints.max;
  const canSubmit = tracks.length > 0 && trackCountValid;

  // Calculate totals
  const totalDuration = useMemo(() => 
    tracks.reduce((sum, t) => sum + t.duration, 0), 
    [tracks]
  );
  const totalPrice = useMemo(() => 
    tracks.reduce((sum, t) => sum + (t.price || 0), 0), 
    [tracks]
  );

  // Auth guards
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
            <h1 className="text-3xl font-bold text-foreground mb-4">Upload Album</h1>
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
              Only artists and labels can upload music.
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
              Set up your {role === "label" ? "label" : "artist"} profile before uploading.
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/onboarding">Complete Profile Setup</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const onSubmit = async (values: AlbumFormValues, isDraft: boolean) => {
    if (!canSubmit) {
      showFeedback({
        type: "error",
        title: "Invalid Track Count",
        message: `${releaseType === 'single' ? 'Singles' : releaseType === 'ep' ? 'EPs' : 'Albums'} require ${constraints.min}-${constraints.max} tracks.`,
      });
      return;
    }

    if (!isDraft && !rightsConfirmed) {
      setRightsError("You must confirm you have the rights to publish this music");
      return;
    }
    setRightsError(undefined);

    const result = await uploadAlbum(
      {
        title: values.title,
        description: values.description || "",
        genre: values.genre || "",
        releaseType,
        artistId: values.artistId,
      },
      coverFile,
      tracks,
      isDraft
    );

    if (result.success) {
      showFeedback({
        type: "success",
        title: isDraft ? "Draft Saved" : "Album Published!",
        message: isDraft
          ? "Your album has been saved as a draft."
          : `Your ${releaseType} is now live with ${tracks.length} tracks!`,
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
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 overflow-x-hidden box-border">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            to="/upload" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to single upload
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">Upload Album / EP</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Release multiple tracks as a cohesive project</p>
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

            {/* Release Type */}
            <ReleaseTypeSelector
              value={releaseType}
              onChange={setReleaseType}
              disabled={isUploading}
            />

            {/* Track Count Indicator */}
            {tracks.length > 0 && (
              <div className={`glass-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${trackCountValid ? 'border-primary/50' : 'border-warning/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {tracks.length} track{tracks.length !== 1 ? 's' : ''} added
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {releaseType === 'single' ? 'Singles' : releaseType === 'ep' ? 'EPs' : 'Albums'}: {constraints.min}-{constraints.max} tracks required
                    </p>
                  </div>
                </div>
                {!trackCountValid && (
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {tracks.length < constraints.min 
                        ? `Need ${constraints.min - tracks.length} more` 
                        : `Remove ${tracks.length - constraints.max}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Album Cover */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-foreground font-medium">Album Cover</label>
                <InfoTooltip content="One cover image for the entire release. 3000x3000px recommended for best quality across all platforms." />
              </div>
              <AlbumCoverUpload
                value={coverFile}
                onChange={setCoverFile}
                uploadProgress={uploadProgress.cover}
                disabled={isUploading}
              />
            </div>

            {/* Album Details */}
            <div className="glass-card p-4 sm:p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Release Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Album Title *
                        <InfoTooltip content="The name of your album, EP, or single release." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter album title"
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
                        <InfoTooltip content="Primary genre for this release. Individual tracks inherit this genre." />
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
                          {MAIN_GENRES.map((genre) => (
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Description
                      <InfoTooltip content="Tell the story of this release. What inspired it? What should listeners expect?" />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your release..."
                        className="bg-muted/50 border-glass-border focus:border-primary min-h-24 resize-none"
                        disabled={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Audio Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-foreground font-medium">Audio Tracks *</label>
                <InfoTooltip content="Upload all tracks at once. You can reorder and edit details after upload." />
              </div>
              <BulkAudioUpload
                tracks={tracks.map(t => ({
                  id: t.id,
                  file: t.file,
                  duration: t.duration,
                  title: t.title,
                  trackNumber: t.trackNumber,
                }))}
                onChange={handleBulkAudioChange}
                minTracks={constraints.min}
                maxTracks={constraints.max}
                disabled={isUploading}
                hideTrackList={tracks.length > 0}
              />
            </div>

            {/* Track List with Drag & Drop */}
            {tracks.length > 0 && (
              <AlbumTrackList
                tracks={tracks}
                onChange={setTracks}
                disabled={isUploading}
                excludeArtistId={role === 'label' ? form.watch('artistId') : user?.id}
              />
            )}

            {/* Summary */}
            {tracks.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="text-foreground font-medium">
                    {Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="text-foreground font-medium">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Rights Confirmation */}
            <RightsConfirmation
              checked={rightsConfirmed}
              onChange={setRightsConfirmed}
              error={rightsError}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="text-foreground font-medium">{uploadProgress.overall}%</span>
                </div>
                <Progress value={uploadProgress.overall} className="h-2" />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-glass-border"
                disabled={isUploading || tracks.length === 0}
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
                disabled={isUploading || !canSubmit}
                onClick={form.handleSubmit((values) => onSubmit(values, false))}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                Publish {releaseType === 'single' ? 'Single' : releaseType === 'ep' ? 'EP' : 'Album'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
