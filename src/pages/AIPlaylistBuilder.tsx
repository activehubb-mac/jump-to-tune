import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Zap, Lock, ArrowLeft, ListMusic, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";

const TEMPLATE_PROMPTS = [
  "Late night driving with bass-heavy trap beats",
  "Chill lo-fi study session vibes",
  "Workout hype with aggressive electronic drops",
  "Ambient space music for deep focus",
];

interface PlaylistResult {
  name: string;
  description: string;
  cover_image: string | null;
  mood_tags: string[];
  recommended_genres: string[];
  suggested_track_ids: string[];
  credits_used: number;
  credits_remaining: number;
}

export default function AIPlaylistBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { aiCredits, isLoading: creditsLoading, refetch } = useAICredits();
  const { showFeedback } = useFeedbackSafe();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PlaylistResult | null>(null);

  const cost = 5;
  const canAfford = aiCredits >= cost;

  if (!user) {
    return (
      <Layout><div className="container mx-auto px-4 py-24 text-center">
        <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Sign in to build AI playlists</h1>
        <Button asChild className="bg-primary text-primary-foreground"><Link to="/auth">Sign In</Link></Button>
      </div></Layout>
    );
  }

  const handleGenerate = async () => {
    if (!prompt) { showFeedback({ type: "error", title: "Required", message: "Describe your playlist." }); return; }
    if (!canAfford) { showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${cost} credits.` }); return; }
    setIsGenerating(true); setResult(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("ai-playlist-builder", {
        body: { prompt },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (error) {
        let msg = "Generation failed.";
        try { const b = JSON.parse(error.context?.body); if (b.error) msg = b.error; } catch {}
        showFeedback({ type: "error", title: "Failed", message: msg }); return;
      }
      setResult(data); refetch();
      showFeedback({ type: "success", title: "Playlist Generated! 🎶", message: `Used ${data.credits_used} credits.`, autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally { setIsGenerating(false); }
  };

  const handleCreatePlaylist = async () => {
    if (!result) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const { data: playlist, error } = await supabase.from("playlists").insert({
        user_id: user!.id, name: result.name, description: result.description,
        cover_image_url: result.cover_image, is_public: true,
      }).select("id").single();
      if (error) throw error;
      if (result.suggested_track_ids.length > 0) {
        const tracks = result.suggested_track_ids.map((tid, i) => ({
          playlist_id: playlist.id, track_id: tid, position: i,
        }));
        await supabase.from("playlist_tracks").insert(tracks);
      }
      showFeedback({ type: "success", title: "Playlist Created!", message: "Your AI playlist is ready.", autoClose: true });
      navigate(`/library/playlist/${playlist.id}`);
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: "Failed to create playlist." });
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild><Link to="/library"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2"><ListMusic className="h-6 w-6 text-primary" /> AI Playlist Builder</h1>
            <p className="text-sm text-muted-foreground">Describe a vibe and AI creates your playlist</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary"><Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">Describe Your Playlist</CardTitle>
              <CardDescription>What mood, genre, or activity?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_PROMPTS.map((t, i) => (
                  <Button key={i} variant="outline" size="sm" className="text-xs border-primary/30 hover:border-primary" onClick={() => setPrompt(t)}>{t.substring(0, 30)}...</Button>
                ))}
              </div>
              <div><Label>Playlist Description *</Label><Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Create a late night trap playlist with dark vibes and heavy bass..." className="mt-1 min-h-[100px] bg-muted/50 border-glass-border" disabled={isGenerating} /></div>
              <Button className="w-full gradient-accent neon-glow-subtle" onClick={handleGenerate} disabled={isGenerating || !prompt}>
                {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Playlist ({cost} credits)</>}
              </Button>
            </CardContent>
          </Card>

          <div>
            {!result && !isGenerating ? (
              <Card className="glass min-h-[350px] flex items-center justify-center">
                <div className="text-center p-8"><ListMusic className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" /><p className="text-muted-foreground text-sm">Your AI playlist will appear here</p></div>
              </Card>
            ) : isGenerating ? (
              <Card className="glass min-h-[350px] flex items-center justify-center">
                <div className="text-center p-8"><Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" /><p className="text-foreground font-medium">Curating your playlist...</p></div>
              </Card>
            ) : result ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                {result.cover_image && (
                  <Card className="glass overflow-hidden"><CardContent className="p-4"><img src={result.cover_image} alt="Playlist Cover" className="w-full aspect-square object-cover rounded-lg" /></CardContent></Card>
                )}
                <Card className="glass"><CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-lg text-foreground">{result.name}</h3>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {result.mood_tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    {result.recommended_genres.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                  {result.suggested_track_ids.length > 0 && <p className="text-xs text-primary">{result.suggested_track_ids.length} tracks matched</p>}
                </CardContent></Card>
                <Button className="w-full gradient-accent neon-glow-subtle" onClick={handleCreatePlaylist}><Check className="h-4 w-4 mr-2" />Create This Playlist</Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
