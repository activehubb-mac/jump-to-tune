import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useDefaultIdentity } from "@/hooks/useDefaultIdentity";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_GENRES } from "@/lib/genres";
import { AI_TOOL_PRICING } from "@/lib/aiPricing";
import { CreditConfirmModal } from "@/components/ai/CreditConfirmModal";
import {
  Rocket, Zap, Lock, Loader2, Sparkles, Music, Video,
  Clapperboard, RotateCcw, Save, ChevronRight, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "input" | "generating" | "result" | "actions";

interface DropResult {
  title: string;
  description: string;
  genre_tags: string[];
  mood_tags: string[];
  lyrics_outline: string;
  cover_image: string;
  avatar_url: string | null;
  credits_used: number;
  credits_remaining: number;
}

const PROGRESS_STAGES = [
  { label: "Crafting concept…", pct: 20 },
  { label: "Generating artwork…", pct: 60 },
  { label: "Building release…", pct: 90 },
];

export default function AIArtistDrop() {
  const { user } = useAuth();
  const { aiCredits } = useAICredits();
  const { identityId, avatarUrl: identityAvatar, visualTheme } = useDefaultIdentity();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("input");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [songIdea, setSongIdea] = useState("");
  const [useIdentity, setUseIdentity] = useState(!!identityId);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState<DropResult | null>(null);
  const [editableTitle, setEditableTitle] = useState("");

  const creditCost = AI_TOOL_PRICING.artist_drop.base;
  const canGenerate = genre && mood;

  const handleGenerate = async () => {
    setShowConfirm(false);
    setStep("generating");
    setStageIdx(0);

    // Animate progress stages
    const timer1 = setTimeout(() => setStageIdx(1), 3000);
    const timer2 = setTimeout(() => setStageIdx(2), 7000);

    try {
      const { data, error } = await supabase.functions.invoke("ai-artist-drop", {
        body: {
          genre,
          mood,
          song_idea: songIdea || undefined,
          avatar_url: useIdentity ? identityAvatar : undefined,
          visual_theme: useIdentity ? visualTheme : undefined,
        },
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as DropResult);
      setEditableTitle(data.title);
      setStep("result");
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setStep("input");
      toast.error(err?.message || "Drop generation failed. Credits refunded.");
    }
  };

  const handleSaveProject = () => {
    if (!result) return;
    const saved = JSON.parse(localStorage.getItem("jt_drop_projects") || "[]");
    saved.push({ ...result, title: editableTitle, savedAt: new Date().toISOString() });
    localStorage.setItem("jt_drop_projects", JSON.stringify(saved));
    toast.success("Project saved!");
    setStep("actions");
  };

  const handleReset = () => {
    setStep("input");
    setResult(null);
    setEditableTitle("");
    setGenre("");
    setMood("");
    setSongIdea("");
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-24">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Sign in to create your drop</h2>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Rocket className="h-7 w-7 text-[hsl(45,80%,50%)]" />
            AI Artist Drop
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Go from zero to a full release in one flow</p>
        </div>

        {/* STEP: INPUT */}
        {step === "input" && (
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardContent className="p-5 space-y-5">
              {/* Genre */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Genre *</label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
                  <SelectContent>
                    {MAIN_GENRES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mood */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Mood / Vibe *</label>
                <Input
                  placeholder="e.g. dark and moody, upbeat summer, introspective…"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
              </div>

              {/* Song Idea */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Song Idea (optional)</label>
                <Textarea
                  placeholder="Describe your song concept, topic, or story…"
                  value={songIdea}
                  onChange={(e) => setSongIdea(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Identity toggle */}
              {identityId && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {identityAvatar ? (
                        <AvatarImage src={identityAvatar} alt="Identity" />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">AI</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm text-foreground">Use my artist identity</span>
                  </div>
                  <Switch checked={useIdentity} onCheckedChange={setUseIdentity} />
                </div>
              )}

              {/* Generate button */}
              <Button
                className="w-full bg-[hsl(45,80%,50%)] text-[hsl(45,80%,10%)] hover:bg-[hsl(45,80%,45%)] font-bold"
                disabled={!canGenerate}
                onClick={() => setShowConfirm(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create My Drop — {creditCost} credits
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You have {aiCredits.toLocaleString()} credits · ≈ ${(aiCredits / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* STEP: GENERATING */}
        {step === "generating" && (
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-[hsl(45,80%,50%)]" />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {PROGRESS_STAGES[stageIdx]?.label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">This may take 15–30 seconds</p>
              </div>
              <Progress value={PROGRESS_STAGES[stageIdx]?.pct} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* STEP: RESULT */}
        {step === "result" && result && (
          <div className="space-y-4">
            {/* Cover Art + Avatar */}
            <Card className="border-[hsl(45,80%,50%,0.3)] bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={result.cover_image}
                    alt="Cover Art"
                    className="w-full aspect-square object-cover"
                  />
                  {result.avatar_url && (
                    <div className="absolute bottom-3 left-3">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-lg">
                        <AvatarImage src={result.avatar_url} />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Song Info */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Song Title</label>
                  <Input
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="text-lg font-bold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <p className="text-sm text-foreground mt-1">{result.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {result.genre_tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                  {result.mood_tags.map((t) => (
                    <Badge key={t} className="text-xs bg-primary/10 text-primary border-primary/20">{t}</Badge>
                  ))}
                </div>

                {result.lyrics_outline && (
                  <div>
                    <label className="text-xs text-muted-foreground">Lyrics Outline</label>
                    <pre className="text-xs text-foreground mt-1 whitespace-pre-wrap font-sans bg-muted/30 p-3 rounded-lg">
                      {result.lyrics_outline}
                    </pre>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {result.credits_used} credits used · {result.credits_remaining} remaining
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSaveProject}
                variant="outline"
                className="border-primary/30 text-primary"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Project
              </Button>
              <Button
                onClick={() => setStep("actions")}
                className="bg-primary text-primary-foreground"
              >
                Next Steps
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP: NEXT ACTIONS */}
        {step === "actions" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-4">What's Next?</h2>

            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4 px-4 border-border hover:border-primary/50"
              onClick={() => navigate("/ai-video")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(45,80%,50%,0.1)]">
                  <Clapperboard className="h-5 w-5 text-[hsl(45,80%,50%)]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">Create Music Video</p>
                  <p className="text-xs text-muted-foreground">From 130 credits</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4 px-4 border-border hover:border-primary/50"
              onClick={() => navigate("/ai-viral")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">Generate Viral Clips</p>
                  <p className="text-xs text-muted-foreground">From 500 credits</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4 px-4 border-border hover:border-primary/50"
              onClick={handleReset}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">Start Over</p>
                  <p className="text-xs text-muted-foreground">Create a new drop</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      <CreditConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        creditCost={creditCost}
        currentCredits={aiCredits}
        summary={`${genre} · ${mood}${useIdentity ? " · Artist identity" : ""}`}
        onConfirm={handleGenerate}
      />
    </Layout>
  );
}
