import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAutopilot, type AutopilotProgress } from "@/hooks/useAutopilot";
import {
  Loader2, Sparkles, CheckCircle2, Circle, AlertCircle, Rocket,
  Image, Video, UserCircle, Music2, Type, Share2, FileText, Copy, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { key: keyof AutopilotProgress; label: string; icon: React.ReactNode }[] = [
  { key: "track_uploaded", label: "Track Uploaded", icon: <Music2 className="w-4 h-4" /> },
  { key: "cover_art", label: "Cover Art", icon: <Image className="w-4 h-4" /> },
  { key: "avatar", label: "Artist Avatar", icon: <UserCircle className="w-4 h-4" /> },
  { key: "lyric_visual", label: "Lyric Visual", icon: <Type className="w-4 h-4" /> },
  { key: "karaoke", label: "Karaoke Ready", icon: <Music2 className="w-4 h-4" /> },
  { key: "video", label: "Music Video", icon: <Video className="w-4 h-4" /> },
  { key: "promo_clips", label: "Promo Captions", icon: <Share2 className="w-4 h-4" /> },
  { key: "release_page", label: "Release Page", icon: <FileText className="w-4 h-4" /> },
];

function StepIcon({ status }: { status: string }) {
  if (status === "done" || status === "ready") return <CheckCircle2 className="w-5 h-5 text-green-400" />;
  if (status === "generating") return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
  if (status === "failed") return <AlertCircle className="w-5 h-5 text-destructive" />;
  return <Circle className="w-5 h-5 text-muted-foreground" />;
}

export default function ArtistAutopilot() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const trackId = searchParams.get("trackId");

  const { session, isStarting, error, startAutopilot, startPolling, publishRelease } = useAutopilot();

  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"prompt" | "building" | "preview">("prompt");
  const [isPublishing, setIsPublishing] = useState(false);

  // If session becomes ready, switch to preview
  useEffect(() => {
    if (session?.status === "ready") setPhase("preview");
    if (session?.status === "published") setPhase("preview");
  }, [session?.status]);

  if (!user || (role !== "artist" && role !== "label")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Artist Access Only</h1>
          <p className="text-muted-foreground mb-6">Sign in as an artist to use Autopilot.</p>
          <Button asChild><Link to="/auth?role=artist">Sign In</Link></Button>
        </div>
      </Layout>
    );
  }

  if (!trackId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Artist Autopilot</h1>
          <p className="text-muted-foreground mb-6">Upload a track first, then launch Autopilot to build your full release package.</p>
          <Button asChild><Link to="/upload">Upload Track</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleStart = async () => {
    const sessionId = await startAutopilot(trackId, prompt || undefined);
    if (sessionId) {
      setPhase("building");
      startPolling(sessionId);
    }
  };

  const handlePublish = async () => {
    if (!session) return;
    setIsPublishing(true);
    const ok = await publishRelease(session.id);
    setIsPublishing(false);
    if (ok) {
      showFeedback({
        type: "success",
        title: "Release Published! 🎉",
        message: "Your full release is now live on JumTunes.",
      });
    }
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedback({ type: "success", title: "Copied!", message: "Caption copied to clipboard." });
  };

  const progress = session?.progress as AutopilotProgress | undefined;
  const completedSteps = progress
    ? STEPS.filter((s) => progress[s.key] === "done" || progress[s.key] === "ready").length
    : 0;
  const totalSteps = STEPS.length;
  const pct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Artist Autopilot</h1>
            <p className="text-sm text-muted-foreground">Build a full release package in one click</p>
          </div>
        </div>

        {/* Prompt Phase */}
        {phase === "prompt" && (
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Visual Style Prompt (optional)</h2>
              <p className="text-sm text-muted-foreground">
                Describe the aesthetic you want for your cover art, avatar, and visuals. Leave blank to auto-generate based on track mood.
              </p>
              <Input
                placeholder="e.g. cyberpunk neon city, dark trap aesthetic, anime concert stage..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="glass-card p-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">What Autopilot Generates</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {STEPS.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    {s.icon}
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-primary font-medium">Cost: 150 AI Credits (bundle)</p>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {isStarting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting Autopilot...</>
              ) : (
                <><Rocket className="w-5 h-5 mr-2" /> Launch Autopilot — 150 Credits</>
              )}
            </Button>
          </div>
        )}

        {/* Building Phase */}
        {phase === "building" && progress && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Building Your Release</h2>
                <span className="text-sm font-medium text-primary">{pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-6">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="space-y-3">
                {STEPS.map((step) => (
                  <div key={step.key} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    progress[step.key] === "generating" && "bg-primary/10",
                    progress[step.key] === "done" && "bg-green-500/5",
                    progress[step.key] === "failed" && "bg-destructive/5",
                  )}>
                    <StepIcon status={progress[step.key]} />
                    <span className={cn(
                      "text-sm font-medium",
                      progress[step.key] === "done" ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {step.label}
                    </span>
                    {progress[step.key] === "generating" && (
                      <span className="text-xs text-primary ml-auto">Generating...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Phase */}
        {phase === "preview" && session && (
          <div className="space-y-6">
            {/* Generated Assets Preview */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Release Package Ready</h2>

              <div className="grid grid-cols-2 gap-4">
                {session.cover_art_url && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Cover Art</p>
                    <img src={session.cover_art_url} alt="Cover Art" className="w-full aspect-square rounded-lg object-cover border border-border" />
                  </div>
                )}
                {session.avatar_url && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Artist Avatar</p>
                    <img src={session.avatar_url} alt="Avatar" className="w-full aspect-square rounded-lg object-cover border border-border" />
                  </div>
                )}
              </div>

              {session.lyric_visual_url && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Lyric Visual</p>
                  <img src={session.lyric_visual_url} alt="Lyric Visual" className="w-full max-h-48 rounded-lg object-cover border border-border" />
                </div>
              )}
            </div>

            {/* Promo Captions */}
            {session.promo_clips && session.promo_clips.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Promo Captions</h2>
                {session.promo_clips.map((clip, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary uppercase">{clip.platform}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleCopyCaption(`${clip.caption}\n\n${clip.hashtags}`)}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <p className="text-sm text-foreground">{clip.caption}</p>
                    <p className="text-xs text-muted-foreground">{clip.hashtags}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Progress Summary */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Generation Summary</h2>
              <div className="grid grid-cols-2 gap-2">
                {progress && STEPS.map((step) => (
                  <div key={step.key} className="flex items-center gap-2 text-sm">
                    <StepIcon status={progress[step.key]} />
                    <span className="text-muted-foreground">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish */}
            {session.status !== "published" ? (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {isPublishing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing...</>
                ) : (
                  <><Rocket className="w-5 h-5 mr-2" /> Publish Release</>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Release Published!</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/ai-viral?trackId=${session.track_id}`)}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Generate Viral Clips
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/artist/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
