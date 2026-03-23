import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Image as ImageIcon, Zap, RefreshCw, Download, Lock, ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useDefaultIdentity } from "@/hooks/useDefaultIdentity";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { getToolCost } from "@/lib/aiPricing";

export default function CoverArtGenerator() {
  const { user } = useAuth();
  const { aiCredits, isLoading: creditsLoading, refetch } = useAICredits();
  const { avatarUrl: defaultAvatarUrl, visualTheme: defaultTheme } = useDefaultIdentity();
  const { showFeedback } = useFeedbackSafe();

  const [prompt, setPrompt] = useState("");
  const [styleHint, setStyleHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const cost = getToolCost("cover_art");
  const canAfford = aiCredits >= cost;

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to generate cover art</h1>
          <Button asChild className="bg-primary text-primary-foreground"><Link to="/auth">Sign In</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleGenerate = async (regenerate = false) => {
    if (!prompt) { showFeedback({ type: "error", title: "Prompt Required", message: "Describe the cover art you want." }); return; }
    if (!canAfford) { showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${cost} credits, have ${aiCredits}.` }); return; }

    setIsGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      // Enhance prompt with identity context if available
      let enhancedPrompt = prompt;
      if (referenceImage) {
        enhancedPrompt = `${prompt}. Use the provided reference image as inspiration for the artwork style.`;
      } else if (defaultAvatarUrl && defaultTheme) {
        enhancedPrompt = `${prompt}. Incorporate the artist's visual identity and ${defaultTheme} style into the artwork.`;
      }

      const { data, error } = await supabase.functions.invoke("ai-cover-art", {
        body: { prompt: enhancedPrompt, style_hint: styleHint, is_regenerate: regenerate, avatar_url: referenceImage || defaultAvatarUrl || undefined },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) {
        let msg = "Generation failed.";
        try { const b = JSON.parse(error.context?.body); if (b.error) msg = b.error; } catch {}
        showFeedback({ type: "error", title: "Failed", message: msg });
        return;
      }

      setCoverImage(data.cover_image);
      setHasGenerated(true);
      refetch();
      showFeedback({ type: "success", title: "Cover Art Generated! 🎨", message: `Used ${data.credits_used} credits.`, autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!coverImage) return;
    const link = document.createElement("a");
    link.href = coverImage;
    link.download = "jumtunes-cover-art.png";
    link.click();
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild><Link to="/ai-release"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" /> Cover Art Generator
            </h1>
            <p className="text-sm text-muted-foreground">Generate stunning AI cover art for your releases</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary"><Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">Describe Your Cover</CardTitle>
              <CardDescription>Be specific about colors, mood, and style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cover Art Description *</Label>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A dark cyberpunk cityscape with neon lights reflecting on wet streets, moody purple and blue tones..." className="mt-1 min-h-[120px] bg-muted/50 border-glass-border" disabled={isGenerating} />
              </div>
              <div>
                <Label>Reference Image (Optional)</Label>
                <input
                  ref={refInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    if (file.size > 5 * 1024 * 1024) return;
                    setIsUploadingRef(true);
                    try {
                      const ext = file.name.split(".").pop();
                      const path = `${user.id}/cover-ref-${Date.now()}.${ext}`;
                      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: true });
                      if (uploadErr) throw uploadErr;
                      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
                      setReferenceImage(urlData.publicUrl);
                    } catch { /* silent */ }
                    finally {
                      setIsUploadingRef(false);
                      if (refInputRef.current) refInputRef.current.value = "";
                    }
                  }}
                />
                <div className="mt-1 flex items-center gap-3">
                  {referenceImage ? (
                    <div className="relative">
                      <img src={referenceImage} alt="Reference" className="h-16 w-16 rounded-lg object-cover border border-border" />
                      <button onClick={() => setReferenceImage(null)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs">×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => refInputRef.current?.click()}
                      disabled={isUploadingRef || isGenerating}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/40 bg-muted/30 hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      {isUploadingRef ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-primary" />}
                      <span className="text-sm text-muted-foreground">Upload reference</span>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label>Style Hint</Label>
                <Input value={styleHint} onChange={e => setStyleHint(e.target.value)} placeholder="minimalist, abstract, photorealistic..." className="mt-1 bg-muted/50 border-glass-border" disabled={isGenerating} />
              </div>
              <Button className="w-full gradient-accent neon-glow-subtle" onClick={() => handleGenerate(hasGenerated)} disabled={isGenerating || !prompt}>
                {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : hasGenerated ? <><RefreshCw className="h-4 w-4 mr-2" />Regenerate ({cost} credits)</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Cover ({cost} credits)</>}
              </Button>
            </CardContent>
          </Card>

          <div>
            {coverImage ? (
              <Card className="glass overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <img src={coverImage} alt="AI Cover Art" className="w-full aspect-square object-cover rounded-lg" />
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={downloadImage}><Download className="h-4 w-4 mr-2" />Download</Button>
                    <Button className="flex-1 gradient-accent" onClick={() => handleGenerate(true)} disabled={isGenerating}><RefreshCw className="h-4 w-4 mr-2" />Regenerate</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass min-h-[400px] flex items-center justify-center">
                <div className="text-center p-8">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">Your cover art will appear here</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
