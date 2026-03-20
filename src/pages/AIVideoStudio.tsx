import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Loader2, Zap, Lock, ArrowLeft, Video, Clock,
  Film, Type, Smartphone, User, Monitor, Square, RectangleVertical,
  CheckCircle2, XCircle, Clock3, Clapperboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import {
  useVideoStudio,
  VIDEO_TYPES,
  EXPORT_FORMATS,
  STYLE_PRESETS,
  DURATION_OPTIONS,
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

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  queued: { icon: <Clock3 className="h-3.5 w-3.5" />, color: "text-amber-400", label: "Queued" },
  processing: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, color: "text-blue-400", label: "Processing" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-400", label: "Completed" },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-destructive", label: "Failed" },
};

export default function AIVideoStudio() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading: creditsLoading } = useAICredits();
  const { jobs, artistTracks, tracksLoading, generate, isGenerating } = useVideoStudio();

  const [trackId, setTrackId] = useState<string | null>(null);
  const [videoType, setVideoType] = useState("music_video");
  const [exportFormat, setExportFormat] = useState("9:16");
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState("cyberpunk");
  const [scenePrompt, setScenePrompt] = useState("");

  const selectedDuration = DURATION_OPTIONS.find((d) => d.seconds === duration)!;
  const canAfford = aiCredits >= selectedDuration.credits;

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

  const handleGenerate = () => {
    generate({
      track_id: trackId,
      video_type: videoType,
      export_format: exportFormat,
      duration_seconds: duration,
      style,
      scene_prompt: scenePrompt,
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
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary">
            <Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}
          </Badge>
        </div>

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
              disabled={isGenerating}
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
          </CardContent>
        </Card>

        {/* Video Gallery */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" /> Your Videos
            </h2>
            {jobs.map((job) => {
              const st = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.queued;
              return (
                <Card key={job.id} className="glass">
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
                      <div className={`flex items-center gap-1 text-xs font-medium ${st.color}`}>
                        {st.icon}
                        {st.label}
                      </div>
                    </div>
                    {job.status === "completed" && job.output_url && (
                      <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                        <a href={job.output_url} target="_blank" rel="noopener noreferrer">
                          Download Video
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
