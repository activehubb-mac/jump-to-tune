import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CreditConfirmModal } from "@/components/ai/CreditConfirmModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Loader2, Zap, Lock, ArrowLeft, Video, Clock,
  Film, Type, Smartphone, User, Monitor, Square, RectangleVertical,
  CheckCircle2, XCircle, Clock3, Clapperboard, Trash2, RotateCcw, Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import {
  useVideoStudio,
  VIDEO_TYPES,
  EXPORT_FORMATS,
  STYLE_PRESETS,
  DURATION_OPTIONS,
  type VideoJob,
} from "@/hooks/useVideoStudio";
import { formatDistanceToNow } from "date-fns";

const VIDEO_TYPE_ICONS: Record<string, React.ReactNode> = {
  music_video: <Film className="h-5 w-5" />,
  lyric_video: <Type className="h-5 w-5" />,
  viral_clip: <Smartphone className="h-5 w-5" />,
  avatar_performance: <User className="h-5 w-5" />,
};

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  "9:16": <RectangleVertical className="h-5 w-5" />,
  "16:9": <Monitor className="h-5 w-5" />,
  "1:1": <Square className="h-5 w-5" />,
};

// Estimated generation times in seconds per duration option
const EST_TIME: Record<number, number> = { 10: 120, 15: 150, 20: 200, [-1]: 300 };

function JobStatusBadge({ job }: { job: VideoJob }) {
  const created = new Date(job.created_at).getTime();
  const elapsed = (Date.now() - created) / 1000;
  const est = EST_TIME[job.duration_seconds] ?? 180;
  const progress = Math.min(Math.round((elapsed / est) * 100), 95);

  if (job.status === "queued") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <Clock3 className="h-3.5 w-3.5" />
        Queued
      </div>
    );
  }
  if (job.status === "processing") {
    return (
      <div className="space-y-1 min-w-[90px]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processing
        </div>
        <Progress value={progress} className="h-1.5 bg-muted" />
        <p className="text-[10px] text-muted-foreground">~{Math.max(Math.ceil((est - elapsed) / 60), 1)} min left</p>
      </div>
    );
  }
  if (job.status === "completed") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
      <XCircle className="h-3.5 w-3.5" />
      Failed
    </div>
  );
}

function VideoJobCard({
  job,
  onDelete,
  onRetry,
  isDeleting,
}: {
  job: VideoJob;
  onDelete: (id: string) => void;
  onRetry: (job: VideoJob) => void;
  isDeleting: boolean;
}) {
  return (
    <Card className="glass">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="secondary" className="text-xs capitalize">
                {job.video_type.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-xs">{job.export_format}</Badge>
              <Badge variant="outline" className="text-xs">{job.style}</Badge>
            </div>
            {job.scene_prompt && (
              <p className="text-xs text-muted-foreground truncate">{job.scene_prompt}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {job.duration_seconds === -1 ? "Full" : `${job.duration_seconds}s`} · {job.credits_used} credits · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </p>
          </div>
          <JobStatusBadge job={job} />
        </div>

        {/* Completed: download */}
        {job.status === "completed" && job.output_url && (
          <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
            <a href={job.output_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download Video
            </a>
          </Button>
        )}

        {/* Failed: retry + delete */}
        {job.status === "failed" && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onRetry(job)}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(job.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AIVideoStudio() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading: creditsLoading } = useAICredits();
  const { jobs, artistTracks, tracksLoading, generate, isGenerating, deleteJob, isDeleting } = useVideoStudio();

  const [trackId, setTrackId] = useState<string | null>(null);
  const [videoType, setVideoType] = useState("music_video");
  const [exportFormat, setExportFormat] = useState("9:16");
  const [duration, setDuration] = useState(10);
  const [style, setStyle] = useState("cyberpunk");
  const [scenePrompt, setScenePrompt] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [style, setStyle] = useState("cyberpunk");
  const [scenePrompt, setScenePrompt] = useState("");

  const selectedDuration = DURATION_OPTIONS.find((d) => d.seconds === duration)!;
  const canAfford = aiCredits >= selectedDuration.credits;
  const activeJobs = jobs.filter((j) => j.status === "queued" || j.status === "processing");

  if (!user || (role !== "artist" && role !== "label")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Artist Access Required</h1>
          <p className="text-muted-foreground mb-4">Sign in as an artist or label to use the Video Studio.</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleGenerateClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmGenerate = () => {
    setShowConfirm(false);
    generate({
      track_id: trackId,
      video_type: videoType,
      export_format: exportFormat,
      duration_seconds: duration,
      style,
      scene_prompt: scenePrompt,
    });
  };

  const handleRetry = (job: VideoJob) => {
    generate({
      track_id: job.track_id,
      video_type: job.video_type,
      export_format: job.export_format,
      duration_seconds: job.duration_seconds,
      style: job.style,
      scene_prompt: job.scene_prompt || "",
    });
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/ai-tools"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Clapperboard className="h-6 w-6 text-primary" /> AI Video Studio
            </h1>
            <p className="text-sm text-muted-foreground">Generate music videos, lyric videos & viral clips</p>
            <p className="text-xs text-primary/70 font-medium mt-0.5">Optimized for TikTok, Reels & Shorts</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary">
            <Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}
          </Badge>
        </div>

        {/* Active jobs indicator */}
        {activeJobs.length > 0 && (
          <Card className="border-blue-500/30 bg-blue-500/5 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
              <p className="text-sm text-blue-300">
                {activeJobs.length} video{activeJobs.length > 1 ? "s" : ""} generating… Credits will be deducted once complete.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Track */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
              Select Track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={trackId ?? ""} onValueChange={(v) => setTrackId(v || null)}>
              <SelectTrigger className="bg-muted/50 border-glass-border">
                <SelectValue placeholder={tracksLoading ? "Loading tracks..." : "Choose a track (optional)"} />
              </SelectTrigger>
              <SelectContent>
                {artistTracks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      {t.cover_art_url && (
                        <img src={t.cover_art_url} alt="" className="h-5 w-5 rounded object-cover" />
                      )}
                      {t.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Link a track so the video attaches to your release page.
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Video Type */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
              Video Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {VIDEO_TYPES.map((vt) => (
                <button
                  key={vt.value}
                  onClick={() => setVideoType(vt.value)}
                  className={`p-3 rounded-lg border text-left transition-all active:scale-[0.97] ${
                    videoType === vt.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-glass-border bg-muted/30 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-foreground">
                    {VIDEO_TYPE_ICONS[vt.value]}
                    <span className="font-medium text-sm">{vt.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-tight">{vt.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Export Format */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
              Export Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {EXPORT_FORMATS.map((ef) => (
                <button
                  key={ef.value}
                  onClick={() => setExportFormat(ef.value)}
                  className={`p-3 rounded-lg border text-center transition-all active:scale-[0.97] ${
                    exportFormat === ef.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-glass-border bg-muted/30 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1 text-foreground">
                    {FORMAT_ICONS[ef.value]}
                  </div>
                  <span className="font-medium text-sm block">{ef.label}</span>
                  <span className="text-xs text-muted-foreground">{ef.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Duration, Style & Prompt */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold">4</span>
              Duration, Style &amp; Scene
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Duration */}
            <div>
              <Label className="text-sm">Duration</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.seconds}
                    onClick={() => setDuration(d.seconds)}
                    className={`p-2.5 rounded-lg border text-center transition-all active:scale-[0.97] ${
                      duration === d.seconds
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-glass-border bg-muted/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="h-3.5 w-3.5 text-foreground" />
                      <span className="font-medium text-sm text-foreground">{d.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{d.credits} cr</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <Label className="text-sm">Visual Style</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`px-2 py-2 rounded-lg border text-center transition-all active:scale-[0.97] ${
                      style === s.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-glass-border bg-muted/30 hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scene prompt */}
            <div>
              <Label className="text-sm">Scene Prompt (optional)</Label>
              <Textarea
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder="Describe extra visual details… e.g. rain-soaked neon streets, glowing signs, camera slowly panning through a crowd…"
                className="mt-1 min-h-[80px] bg-muted/50 border-glass-border text-sm"
                disabled={isGenerating}
              />
            </div>

            {/* Generate */}
            <Button
              className="w-full gradient-accent neon-glow-subtle"
              onClick={handleGenerate}
              disabled={isGenerating || !canAfford}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Generate Video ({selectedDuration.credits} credits)</>
              )}
            </Button>
            {!canAfford && !creditsLoading && (
              <p className="text-xs text-destructive text-center">
                Not enough credits.{" "}
                <Link to="/wallet" className="underline">Buy more</Link>
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Generation takes ~2-5 minutes. You'll be notified when ready.
            </p>
          </CardContent>
        </Card>

        {/* Video Gallery */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" /> Your Videos
            </h2>
            {jobs.map((job) => (
              <VideoJobCard
                key={job.id}
                job={job}
                onDelete={(id) => deleteJob(id)}
                onRetry={handleRetry}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}

        {/* Watermark note */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Generated videos include a small JumTunes watermark.
        </p>
      </div>
    </Layout>
  );
}
