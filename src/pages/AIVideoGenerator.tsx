import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Zap, Lock, ArrowLeft, Video, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";

const DURATION_OPTIONS = [
  { seconds: 10, credits: 20, label: "10 seconds" },
  { seconds: 30, credits: 50, label: "30 seconds" },
  { seconds: 60, credits: 100, label: "60 seconds" },
];

const STYLE_OPTIONS = [
  { value: "abstract visualizer", label: "Abstract Visualizer", desc: "Geometric shapes and reactive audio visuals" },
  { value: "cinematic scenes", label: "Cinematic Scenes", desc: "AI-generated cinematic visuals matching your music" },
];

export default function AIVideoGenerator() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading: creditsLoading, refetch } = useAICredits();
  const { showFeedback } = useFeedbackSafe();

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [style, setStyle] = useState("abstract visualizer");
  const [isGenerating, setIsGenerating] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const selectedDuration = DURATION_OPTIONS.find(d => d.seconds === duration)!;
  const canAfford = aiCredits >= selectedDuration.credits;

  if (!user || (role !== "artist" && role !== "label")) {
    return (
      <Layout><div className="container mx-auto px-4 py-24 text-center">
        <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Artist Access Required</h1>
        <Button asChild className="bg-primary text-primary-foreground"><Link to="/auth">Sign In</Link></Button>
      </div></Layout>
    );
  }

  const handleGenerate = async () => {
    if (!prompt) { showFeedback({ type: "error", title: "Required", message: "Describe the video you want." }); return; }
    if (!canAfford) { showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${selectedDuration.credits} credits.` }); return; }
    setIsGenerating(true); setQueuedMessage(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("ai-video-generator", {
        body: { prompt, duration_seconds: duration, style },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (error) {
        let msg = "Generation failed.";
        try { const b = JSON.parse(error.context?.body); if (b.error) msg = b.error; } catch {}
        showFeedback({ type: "error", title: "Failed", message: msg }); return;
      }
      setQueuedMessage(data.message);
      refetch();
      showFeedback({ type: "success", title: "Video Queued! 🎬", message: `Used ${data.credits_used} credits.`, autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally { setIsGenerating(false); }
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild><Link to="/artist/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2"><Video className="h-6 w-6 text-primary" /> AI Video Generator</h1>
            <p className="text-sm text-muted-foreground">Generate music videos and social visualizers</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary"><Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}</Badge>
        </div>

        <div className="space-y-6">
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">Video Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Duration */}
              <div><Label>Duration</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {DURATION_OPTIONS.map(d => (
                    <button key={d.seconds} onClick={() => setDuration(d.seconds)} className={`p-3 rounded-lg border text-center transition-all ${duration === d.seconds ? "border-primary bg-primary/10" : "border-glass-border bg-muted/30 hover:border-primary/50"}`}>
                      <div className="flex items-center justify-center gap-1 mb-1"><Clock className="h-4 w-4" /><span className="font-medium text-sm">{d.label}</span></div>
                      <span className="text-xs text-muted-foreground">{d.credits} credits</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Style */}
              <div><Label>Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {STYLE_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setStyle(s.value)} className={`p-3 rounded-lg border text-left transition-all ${style === s.value ? "border-primary bg-primary/10" : "border-glass-border bg-muted/30 hover:border-primary/50"}`}>
                      <span className="font-medium text-sm block">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Prompt */}
              <div><Label>Video Description *</Label>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A neon-lit cyberpunk cityscape with rain and glowing signs, camera moving through streets..." className="mt-1 min-h-[100px] bg-muted/50 border-glass-border" disabled={isGenerating} />
              </div>
              <Button className="w-full gradient-accent neon-glow-subtle" onClick={handleGenerate} disabled={isGenerating || !prompt}>
                {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Video ({selectedDuration.credits} credits)</>}
              </Button>
              {!canAfford && !creditsLoading && <p className="text-xs text-destructive text-center">Not enough credits. <Link to="/wallet" className="underline">Buy more</Link></p>}
            </CardContent>
          </Card>

          {queuedMessage && (
            <Card className="glass border-primary/30">
              <CardContent className="p-6 text-center">
                <Video className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-bold text-lg text-foreground mb-2">Video Generation Queued</h3>
                <p className="text-sm text-muted-foreground">{queuedMessage}</p>
                <p className="text-xs text-muted-foreground mt-3">You'll receive a notification when your video is ready.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
