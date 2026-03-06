import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Zap, Lock, ArrowLeft, User, Palette, Check, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";

interface IdentityResult {
  name_suggestions: string[];
  bio: string;
  visual_theme: string;
  tagline: string;
  avatar_image: string | null;
  credits_used: number;
  credits_remaining: number;
}

export default function AIIdentityBuilder() {
  const { user, role } = useAuth();
  const { aiCredits, isLoading: creditsLoading, refetch } = useAICredits();
  const { showFeedback } = useFeedbackSafe();

  const [genre, setGenre] = useState("");
  const [vibe, setVibe] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<IdentityResult | null>(null);

  const cost = 5;
  const canAfford = aiCredits >= cost;

  if (!user || (role !== "artist" && role !== "label")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Artist Access Required</h1>
          <p className="text-muted-foreground mb-6">Sign in as an artist to build your AI identity.</p>
          <Button asChild className="bg-primary text-primary-foreground"><Link to="/auth">Sign In</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleGenerate = async () => {
    if (!canAfford) { showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${cost} credits.` }); return; }
    setIsGenerating(true);
    setResult(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("ai-identity-builder", {
        body: { genre, vibe, inspiration },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (error) {
        let msg = "Generation failed.";
        try { const b = JSON.parse(error.context?.body); if (b.error) msg = b.error; } catch {}
        showFeedback({ type: "error", title: "Failed", message: msg }); return;
      }
      setResult(data);
      refetch();
      showFeedback({ type: "success", title: "Identity Generated! ✨", message: `Used ${data.credits_used} credits.`, autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally { setIsGenerating(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedback({ type: "success", title: "Copied!", message: "Copied to clipboard.", autoClose: true, autoCloseDelay: 2000 });
  };

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild><Link to="/artist/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2"><User className="h-6 w-6 text-primary" /> AI Artist Identity Builder</h1>
            <p className="text-sm text-muted-foreground">Generate your unique artist brand with AI</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary"><Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}</Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Your Vision</CardTitle>
              <CardDescription>Tell us about your artistic direction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Primary Genre</Label><Input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Trap, Electronic, Lo-Fi..." className="mt-1 bg-muted/50 border-glass-border" disabled={isGenerating} /></div>
              <div><Label>Vibe / Aesthetic</Label><Input value={vibe} onChange={e => setVibe(e.target.value)} placeholder="Dark, futuristic, ethereal..." className="mt-1 bg-muted/50 border-glass-border" disabled={isGenerating} /></div>
              <div><Label>Inspiration (optional)</Label><Input value={inspiration} onChange={e => setInspiration(e.target.value)} placeholder="Artists or styles that inspire you" className="mt-1 bg-muted/50 border-glass-border" disabled={isGenerating} /></div>
              <Button className="w-full gradient-accent neon-glow-subtle" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building Identity...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Identity ({cost} credits)</>}
              </Button>
              {!canAfford && !creditsLoading && <p className="text-xs text-destructive text-center">Not enough credits. <Link to="/wallet" className="underline">Buy more</Link></p>}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {!result && !isGenerating && (
              <Card className="glass min-h-[400px] flex items-center justify-center">
                <div className="text-center p-8"><User className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" /><p className="text-muted-foreground text-sm">Your AI-generated identity will appear here</p></div>
              </Card>
            )}
            {isGenerating && (
              <Card className="glass min-h-[400px] flex items-center justify-center">
                <div className="text-center p-8"><Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" /><p className="text-foreground font-medium">Crafting your identity...</p></div>
              </Card>
            )}
            {result && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {result.avatar_image && (
                  <Card className="glass"><CardContent className="p-4"><img src={result.avatar_image} alt="AI Avatar" className="w-full aspect-square object-cover rounded-lg" /></CardContent></Card>
                )}
                <Card className="glass"><CardHeader className="pb-2"><CardTitle className="text-sm">Name Suggestions</CardTitle></CardHeader>
                  <CardContent><div className="space-y-2">{result.name_suggestions.map((name, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30">
                      <span className="font-medium text-foreground">{name}</span>
                      <Button variant="ghost" size="sm" onClick={() => copy(name)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  ))}</div></CardContent>
                </Card>
                <Card className="glass"><CardHeader className="pb-2"><div className="flex justify-between"><CardTitle className="text-sm">Tagline</CardTitle><Button variant="ghost" size="sm" onClick={() => copy(result.tagline)}><Copy className="h-3 w-3" /></Button></div></CardHeader>
                  <CardContent><p className="text-sm italic text-primary">"{result.tagline}"</p></CardContent>
                </Card>
                <Card className="glass"><CardHeader className="pb-2"><div className="flex justify-between"><CardTitle className="text-sm">Bio</CardTitle><Button variant="ghost" size="sm" onClick={() => copy(result.bio)}><Copy className="h-3 w-3" /></Button></div></CardHeader>
                  <CardContent><p className="text-sm text-foreground/80">{result.bio}</p></CardContent>
                </Card>
                <Card className="glass"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Visual Theme</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-foreground/80">{result.visual_theme}</p></CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
