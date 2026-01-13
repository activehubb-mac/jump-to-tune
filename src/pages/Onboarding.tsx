import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music, ArrowRight, ArrowLeft, Loader2, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { cn } from "@/lib/utils";

const GENRE_OPTIONS = [
  "Hip Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz",
  "Classical", "Country", "Reggae", "Afrobeats", "Latin", "Indie"
];

type OnboardingStep = "welcome" | "avatar" | "bio" | "genres" | "complete";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, role, isLoading, refreshProfile } = useAuth();
  const { showFeedback } = useFeedback();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect fans to home and already-onboarded users to dashboard
  useEffect(() => {
    if (!isLoading && user && profile !== null) {
      if (role === "fan") {
        navigate("/");
      } else if (profile.onboarding_completed) {
        // Already onboarded - redirect to dashboard
        navigate(role === "artist" ? "/artist/dashboard" : "/label/dashboard");
      }
    }
  }, [isLoading, user, role, profile, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  // Initialize state from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : prev.length < 5
        ? [...prev, genre]
        : prev
    );
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // Save genres - first delete existing, then insert new ones
      if (selectedGenres.length > 0) {
        // Delete existing genres
        await supabase
          .from("profile_genres")
          .delete()
          .eq("profile_id", user.id);

        // Insert new genres
        const genreInserts = selectedGenres.map((genre) => ({
          profile_id: user.id,
          genre,
        }));

        const { error: genresError } = await supabase
          .from("profile_genres")
          .insert(genreInserts);

        if (genresError) {
          console.error("Failed to save genres:", genresError);
          // Don't throw - genres are not critical for onboarding completion
        }
      }

      await refreshProfile();
      setStep("complete");
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Something went wrong",
        message: "Could not save your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const goToDashboard = () => {
    if (role === "artist") {
      navigate("/artist/dashboard");
    } else if (role === "label") {
      navigate("/label/dashboard");
    } else {
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps: { key: OnboardingStep; label: string }[] = [
    { key: "welcome", label: "Welcome" },
    { key: "avatar", label: "Photo" },
    { key: "bio", label: "About" },
    { key: "genres", label: "Genres" },
    { key: "complete", label: "Done" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 pt-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  "flex-1 h-1 rounded-full mx-1 transition-colors",
                  i <= currentStepIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Welcome Step */}
          {step === "welcome" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-accent neon-glow">
                <Sparkles className="w-10 h-10 text-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome to JumTunes!
                </h1>
                <p className="text-muted-foreground">
                  Let's set up your {role === "label" ? "label" : "artist"} profile so fans can discover you.
                </p>
              </div>
              <Button
                onClick={() => setStep("avatar")}
                className="w-full gradient-accent neon-glow-subtle hover:neon-glow"
              >
                Let's Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Avatar Step */}
          {step === "avatar" && (
            <div className="text-center space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Add a Profile Photo
                </h1>
                <p className="text-muted-foreground">
                  Help fans recognize you with a great profile picture.
                </p>
              </div>

              <div className="flex justify-center py-6">
                <AvatarUpload
                  userId={user?.id || ""}
                  currentAvatarUrl={avatarUrl}
                  onAvatarChange={setAvatarUrl}
                  size="lg"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("welcome")}
                  className="flex-1 border-glass-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("bio")}
                  className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
                >
                  {avatarUrl ? "Continue" : "Skip for Now"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Bio Step */}
          {step === "bio" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Tell Your Story
                </h1>
                <p className="text-muted-foreground">
                  Share a bit about yourself with your fans.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    {role === "label" ? "Label Name" : "Artist Name"}
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={role === "label" ? "Your label name" : "Your artist name"}
                    className="bg-muted/50 border-glass-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your story, influences, and what makes your music unique..."
                    rows={5}
                    className="bg-muted/50 border-glass-border resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("avatar")}
                  className="flex-1 border-glass-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("genres")}
                  className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Genres Step */}
          {step === "genres" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Select Your Genres
                </h1>
                <p className="text-muted-foreground">
                  Choose up to 5 genres that describe your music.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center py-4">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedGenres.includes(genre)
                        ? "bg-primary text-primary-foreground neon-glow-subtle"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {selectedGenres.length}/5 selected
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("bio")}
                  className="flex-1 border-glass-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Complete Setup
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 neon-glow">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  You're All Set!
                </h1>
                <p className="text-muted-foreground">
                  Your profile is ready. Start uploading music and connecting with fans.
                </p>
              </div>
              <Button
                onClick={goToDashboard}
                className="w-full gradient-accent neon-glow-subtle hover:neon-glow"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="relative z-10 pb-8 flex justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Music className="w-5 h-5" />
          <span className="font-semibold">JumTunes</span>
        </div>
      </div>
    </div>
  );
}
