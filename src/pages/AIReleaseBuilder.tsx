import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Music,
  Wand2,
  Image as ImageIcon,
  Tag,
  FileText,
  Zap,
  Check,
  Copy,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";

const AI_TOOLS = [
  "Suno",
  "Udio",
  "Stable Audio",
  "MusicGen",
  "Producer/Self-made",
  "Other",
];

const TEMPLATE_PROMPTS = [
  { label: "Trap", prompt: "A futuristic trap song about a neon city at night with cinematic bass and dark synths." },
  { label: "Electronic", prompt: "An uplifting electronic track with euphoric synths, driving beats, and festival energy." },
  { label: "Emotional Ballad", prompt: "A heartfelt emotional ballad about lost love with piano, strings, and gentle vocals." },
  { label: "Lo-Fi", prompt: "A chill lo-fi beat with warm vinyl crackle, mellow jazz chords, and rainy day vibes." },
];

interface ReleaseResult {
  title_suggestions: string[];
  description: string;
  genre_tags: string[];
  mood_tags: string[];
  cover_art_prompt: string;
  cover_image: string | null;
  credits_used: number;
  credits_remaining: number;
}

export default function AIReleaseBuilder() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { aiCredits, isLoading: creditsLoading, refetch: refetchCredits } = useAICredits();
  const { showFeedback } = useFeedbackSafe();

  const [prompt, setPrompt] = useState("");
  const [aiTool, setAiTool] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [genreHint, setGenreHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ReleaseResult | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const cost = getCost("release_builder") || 10;
  const canAfford = aiCredits >= cost;

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to use AI Release Builder</h1>
          <p className="text-muted-foreground mb-6">Create AI-powered release packages for your music.</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (role !== "artist" && role !== "label") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Artist Access Required</h1>
          <p className="text-muted-foreground mb-6">Only artists and labels can use the AI Release Builder.</p>
          <Button asChild variant="outline">
            <Link to="/browse">Browse Music</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleGenerate = async () => {
    if (!prompt && !lyrics) {
      showFeedback({ type: "error", title: "Input Required", message: "Please provide a prompt or lyrics." });
      return;
    }
    if (!canAfford) {
      showFeedback({
        type: "error",
        title: "Insufficient Credits",
        message: `You need ${cost} AI credits but have ${aiCredits}. Purchase more credits to continue.`,
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("ai-release-builder", {
        body: { prompt, ai_tool_used: aiTool, lyrics, genre_hint: genreHint },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) {
        let msg = "AI generation failed. Please try again.";
        try {
          if (error.context?.body) {
            const body = JSON.parse(error.context.body);
            if (body.error) msg = body.error;
          }
        } catch {}
        showFeedback({ type: "error", title: "Generation Failed", message: msg });
        return;
      }

      setResult(data);
      setSelectedTitle(data.title_suggestions?.[0] || null);
      refetchCredits();

      showFeedback({
        type: "success",
        title: "Release Package Generated! 🎵",
        message: `Used ${data.credits_used} credits. ${data.credits_remaining} credits remaining.`,
        autoClose: true,
        autoCloseDelay: 4000,
      });
    } catch (err) {
      showFeedback({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedback({ type: "success", title: "Copied!", message: "Copied to clipboard.", autoClose: true, autoCloseDelay: 2000 });
  };

  const handleUseRelease = () => {
    // Navigate to upload page with pre-filled data
    const params = new URLSearchParams();
    if (selectedTitle) params.set("title", selectedTitle);
    if (result?.description) params.set("description", result.description);
    if (result?.genre_tags?.[0]) params.set("genre", result.genre_tags[0]);
    if (result?.mood_tags) params.set("moods", result.mood_tags.join(","));
    navigate(`/upload?${params.toString()}`);
  };

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to={role === "artist" ? "/artist/dashboard" : "/label/dashboard"}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Release Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Describe your track and AI generates the full release package
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 border-primary/50 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            {creditsLoading ? "..." : aiCredits} credits
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Describe Your Track
                </CardTitle>
                <CardDescription>
                  The more detail you provide, the better the AI output
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template buttons */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Templates</Label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_PROMPTS.map((t) => (
                      <Button
                        key={t.label}
                        variant="outline"
                        size="sm"
                        className="text-xs border-primary/30 hover:border-primary hover:bg-primary/10"
                        onClick={() => setPrompt(t.prompt)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Track Prompt *</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Create a futuristic trap song about a neon city at night with cinematic bass and dark synths."
                    className="mt-1 min-h-[100px] bg-muted/50 border-glass-border"
                    disabled={isGenerating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>AI Tool Used</Label>
                    <Select value={aiTool} onValueChange={setAiTool} disabled={isGenerating}>
                      <SelectTrigger className="mt-1 bg-muted/50 border-glass-border">
                        <SelectValue placeholder="Select tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_TOOLS.map((tool) => (
                          <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Genre Hint</Label>
                    <Input
                      value={genreHint}
                      onChange={(e) => setGenreHint(e.target.value)}
                      placeholder="e.g. Trap, Lo-Fi"
                      className="mt-1 bg-muted/50 border-glass-border"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div>
                  <Label>Lyrics (optional)</Label>
                  <Textarea
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Paste your lyrics here for more accurate results..."
                    className="mt-1 min-h-[80px] bg-muted/50 border-glass-border"
                    disabled={isGenerating}
                  />
                </div>

                <Button
                  className="w-full gradient-accent neon-glow-subtle"
                  onClick={handleGenerate}
                  disabled={isGenerating || (!prompt && !lyrics)}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Release Package...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Release ({cost} credits)
                    </>
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
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {!result && !isGenerating && (
              <Card className="glass min-h-[400px] flex items-center justify-center">
                <div className="text-center p-8">
                  <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">
                    Your AI-generated release package will appear here
                  </p>
                </div>
              </Card>
            )}

            {isGenerating && (
              <Card className="glass min-h-[400px] flex items-center justify-center">
                <div className="text-center p-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-foreground font-medium mb-1">Creating your release package...</p>
                  <p className="text-muted-foreground text-sm">
                    Generating titles, description, tags, and cover art
                  </p>
                </div>
              </Card>
            )}

            {result && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {/* Cover Art */}
                {result.cover_image && (
                  <Card className="glass overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Generated Cover Art
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={result.cover_image}
                        alt="AI Generated Cover Art"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Title Suggestions */}
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" />
                      Title Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.title_suggestions.map((title, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTitle(title)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedTitle === title
                              ? "bg-primary/20 border border-primary/50 text-foreground"
                              : "bg-muted/30 hover:bg-muted/50 text-foreground/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{title}</span>
                            {selectedTitle === title && <Check className="h-4 w-4 text-primary" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Release Description
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.description)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80">{result.description}</p>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Genres</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.genre_tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Moods</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.mood_tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1 gradient-accent neon-glow-subtle" onClick={handleUseRelease}>
                    <Check className="h-4 w-4 mr-2" />
                    Use This Release
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating || !canAfford}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
