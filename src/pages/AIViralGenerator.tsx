import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Loader2, Zap, Lock, ArrowLeft, Video, Copy, Check, Download, Hash, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useViralGenerator } from "@/hooks/useViralGenerator";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/ai/CreditConfirmModal";

const CLIP_OPTIONS = [
  { clips: 3, credits: 500, label: "3 Clips" },
  { clips: 5, credits: 850, label: "5 Clips" },
];

const FORMAT_OPTIONS = [
  { value: "tiktok", label: "TikTok", desc: "Vertical 9:16" },
  { value: "instagram_reel", label: "IG Reel", desc: "Vertical 9:16" },
  { value: "youtube_short", label: "YT Short", desc: "Vertical 9:16" },
  { value: "square_promo", label: "Square", desc: "1:1 promo" },
];

const STYLE_OPTIONS = [
  { value: "abstract visualizer", label: "Abstract Visualizer", desc: "Reactive shapes & audio" },
  { value: "cinematic scenes", label: "Cinematic Scenes", desc: "AI cinematic visuals" },
  { value: "lyric-focused promo", label: "Lyric Promo", desc: "Text-driven with lyrics" },
  { value: "cover-art motion promo", label: "Cover Art Motion", desc: "Animated cover art" },
];

export default function AIViralGenerator() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading: creditsLoading } = useAICredits();
  const { showFeedback } = useFeedbackSafe();
  const [searchParams] = useSearchParams();

  const [selectedTrackId, setSelectedTrackId] = useState(searchParams.get("track") || "");
  const [format, setFormat] = useState("tiktok");
  const [selectedClipOption, setSelectedClipOption] = useState(0);
  const [style, setStyle] = useState("abstract visualizer");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { assets, isLoading: assetsLoading, generate, isGenerating } = useViralGenerator(selectedTrackId || undefined);

  // Fetch user's tracks for the selector
  const { data: userTracks = [] } = useQuery({
    queryKey: ["my-tracks-for-viral", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("id, title, cover_art_url, genre")
        .eq("artist_id", user!.id)
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Auto-select track from URL param
  useEffect(() => {
    const trackParam = searchParams.get("track");
    if (trackParam) setSelectedTrackId(trackParam);
  }, [searchParams]);

  const currentClipOption = CLIP_OPTIONS[selectedClipOption];
  const canAfford = aiCredits >= currentClipOption.credits;
  const selectedTrack = userTracks.find((t) => t.id === selectedTrackId);

  if (!user || (role !== "artist" && role !== "label")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Artist Access Required</h1>
          <p className="text-muted-foreground mb-4">Only artists and labels can generate viral content.</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleGenerateClick = () => {
    if (!selectedTrackId) {
      showFeedback({ type: "error", title: "Select a Track", message: "Choose a track to promote." });
      return;
    }
    if (!canAfford) {
      showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${currentClipOption.credits} credits.` });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirm(false);
    await generate({
      track_id: selectedTrackId,
      asset_type: format,
      duration_seconds: 10,
      style,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/ai-tools"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              AI Viral Generator
            </h1>
            <p className="text-sm text-muted-foreground">Turn your songs into short-form promo content</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            {creditsLoading ? "..." : aiCredits}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Configuration */}
          <div className="space-y-6">
            {/* Track Selector */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Select Track</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Choose a track to promote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userTracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        <span className="flex items-center gap-2">
                          {track.cover_art_url && (
                            <img src={track.cover_art_url} className="h-5 w-5 rounded object-cover" alt="" />
                          )}
                          {track.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTrack && (
                  <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    {selectedTrack.cover_art_url && (
                      <img src={selectedTrack.cover_art_url} className="h-12 w-12 rounded-lg object-cover" alt="" />
                    )}
                    <div>
                      <p className="font-medium text-foreground text-sm">{selectedTrack.title}</p>
                      <p className="text-xs text-muted-foreground">{selectedTrack.genre || "No genre"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Format */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Choose Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        format === f.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium text-sm text-foreground block">{f.label}</span>
                      <span className="text-xs text-muted-foreground">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Duration */}
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Duration & Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Duration</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.seconds}
                        onClick={() => setDuration(d.seconds)}
                        className={cn(
                          "p-3 rounded-lg border text-center transition-all",
                          duration === d.seconds
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30 hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium text-sm">{d.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{d.credits} credits</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Visual Style</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {STYLE_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          style === s.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30 hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium text-sm text-foreground block">{s.label}</span>
                        <span className="text-xs text-muted-foreground">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              className="w-full gradient-accent neon-glow-subtle h-12 text-base"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTrackId || !canAfford}
            >
              {isGenerating ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" />Generate Viral Content ({selectedDuration.credits} credits)</>
              )}
            </Button>
            {!canAfford && !creditsLoading && (
              <p className="text-xs text-destructive text-center">
                Not enough credits. <Link to="/wallet" className="underline">Buy more</Link>
              </p>
            )}
          </div>

          {/* Right: Generated Assets */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Generated Assets</h2>

            {assetsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : assets.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No viral content yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Select a track and generate your first promo clip!</p>
                </CardContent>
              </Card>
            ) : (
              assets.map((asset) => (
                <Card key={asset.id} className="glass border-border">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {asset.asset_type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {asset.duration_seconds}s
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            asset.status === "completed" && "border-green-500/50 text-green-500",
                            asset.status === "queued" && "border-amber-500/50 text-amber-500",
                            asset.status === "failed" && "border-destructive/50 text-destructive"
                          )}
                        >
                          {asset.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Caption */}
                    {asset.caption_text && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Caption
                          </span>
                          <button
                            onClick={() => copyToClipboard(asset.caption_text!, `caption-${asset.id}`)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {copiedField === `caption-${asset.id}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy
                          </button>
                        </div>
                        <p className="text-sm text-foreground bg-muted/30 p-2 rounded">{asset.caption_text}</p>
                      </div>
                    )}

                    {/* Hook */}
                    {asset.hook_text && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Hook Text
                          </span>
                          <button
                            onClick={() => copyToClipboard(asset.hook_text!, `hook-${asset.id}`)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {copiedField === `hook-${asset.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            Copy
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-foreground bg-primary/5 p-2 rounded border border-primary/20">
                          {asset.hook_text}
                        </p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {asset.hashtag_set && asset.hashtag_set.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Hashtags
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(asset.hashtag_set.map((h) => `#${h}`).join(" "), `tags-${asset.id}`)
                            }
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {copiedField === `tags-${asset.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            Copy All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {asset.hashtag_set.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Download (if video is ready) */}
                    {asset.file_url && asset.status === "completed" && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={asset.file_url} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download Video
                        </a>
                      </Button>
                    )}

                    {asset.status === "queued" && (
                      <p className="text-xs text-amber-500 text-center">
                        Video generation in progress. You'll be notified when ready.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
