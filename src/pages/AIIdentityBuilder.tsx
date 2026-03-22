import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, Zap, Lock, ArrowLeft, User, Palette, Copy, Upload, Camera, RefreshCw, Wand2, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditConfirmModal } from "@/components/ai/CreditConfirmModal";
import { AI_TOOL_PRICING } from "@/lib/aiPricing";
import { cn } from "@/lib/utils";

const OUTPUT_STYLES = [
  { value: "realistic", label: "Realistic Artist Portrait" },
  { value: "futuristic", label: "Futuristic" },
  { value: "animated", label: "Animated" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "luxury", label: "Luxury / Editorial" },
];

const LIKENESS_LABELS = ["Low", "Medium", "High"];

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

  const [mode, setMode] = useState<"vision" | "photo">("vision");

  // Vision fields
  const [genre, setGenre] = useState("");
  const [vibe, setVibe] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [accessories, setAccessories] = useState("");

  // Photo fields
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [outputStyle, setOutputStyle] = useState("realistic");
  const [likeness, setLikeness] = useState(1); // 0=Low, 1=Medium, 2=High
  const [photoAccessories, setPhotoAccessories] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState("");
  const [hdMode, setHdMode] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<IdentityResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pricing = AI_TOOL_PRICING.identity_builder;
  const cost = mode === "vision" ? 15 : hdMode ? 40 : 25;
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showFeedback({ type: "error", title: "File too large", message: "Max 5MB allowed." });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!canAfford) {
      showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${cost} credits.` });
      return;
    }
    if (mode === "photo" && !photoFile) {
      showFeedback({ type: "error", title: "No Photo", message: "Please upload a photo first." });
      return;
    }
    setConfirmOpen(true);
  };

  const executeGenerate = async () => {
    setConfirmOpen(false);
    setIsGenerating(true);
    setResult(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      let photo_base64: string | null = null;
      if (mode === "photo" && photoFile) {
        const reader = new FileReader();
        photo_base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
      }

      const { data, error } = await supabase.functions.invoke("ai-identity-builder", {
        body: {
          mode,
          genre,
          vibe,
          inspiration,
          visual_style: visualStyle,
          color_palette: colorPalette,
          accessories: mode === "vision" ? accessories : photoAccessories,
          // Photo-mode fields
          photo_base64,
          output_style: outputStyle,
          preserve_likeness: LIKENESS_LABELS[likeness].toLowerCase(),
          hd: hdMode,
          background_style: backgroundStyle,
        },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) {
        let msg = "Generation failed.";
        try { const b = JSON.parse(error.context?.body); if (b.error) msg = b.error; } catch {}
        showFeedback({ type: "error", title: "Failed", message: msg });
        return;
      }
      setResult(data);
      refetch();
      showFeedback({ type: "success", title: "Identity Generated! ✨", message: `Used ${data.credits_used} credits.`, autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedback({ type: "success", title: "Copied!", message: "Copied to clipboard.", autoClose: true, autoCloseDelay: 2000 });
  };

  const costLabel = mode === "vision"
    ? `Generate Identity (${cost} credits)`
    : hdMode
      ? `HD Recreate (${cost} credits)`
      : `Photo Recreate (${cost} credits)`;

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild><Link to="/artist/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2"><User className="h-6 w-6 text-primary" /> AI Artist Identity Builder</h1>
            <p className="text-sm text-muted-foreground">Generate from your vision or recreate yourself from a photo</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary"><Zap className="h-3 w-3 mr-1" />{creditsLoading ? "..." : aiCredits}</Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Build Your Identity</CardTitle>
              <CardDescription>Choose your creation method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={mode} onValueChange={(v) => setMode(v as "vision" | "photo")}>
                <TabsList className="w-full">
                  <TabsTrigger value="vision" className="flex-1 gap-1.5"><Wand2 className="h-3.5 w-3.5" />From Vision</TabsTrigger>
                  <TabsTrigger value="photo" className="flex-1 gap-1.5"><Camera className="h-3.5 w-3.5" />From My Photo</TabsTrigger>
                </TabsList>

                <TabsContent value="vision" className="space-y-3 mt-3">
                  <div><Label>Primary Genre</Label><Input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Trap, Electronic, Lo-Fi..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <div><Label>Vibe / Aesthetic</Label><Input value={vibe} onChange={e => setVibe(e.target.value)} placeholder="Dark, futuristic, ethereal..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <div><Label>Inspiration (optional)</Label><Input value={inspiration} onChange={e => setInspiration(e.target.value)} placeholder="Artists or styles that inspire you" className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <div><Label>Visual Style (optional)</Label><Input value={visualStyle} onChange={e => setVisualStyle(e.target.value)} placeholder="Minimalist, maximalist, retro..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <div><Label>Color Palette (optional)</Label><Input value={colorPalette} onChange={e => setColorPalette(e.target.value)} placeholder="Neon green & black, warm earth tones..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <div><Label>Accessories (optional)</Label><Input value={accessories} onChange={e => setAccessories(e.target.value)} placeholder="Sunglasses, chains, headphones..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <p className="text-xs text-muted-foreground text-center">{pricing.tiers?.[0]?.credits} credits</p>
                </TabsContent>

                <TabsContent value="photo" className="space-y-3 mt-3">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} disabled={isGenerating} />
                  <div
                    onClick={() => !isGenerating && fileRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      "border-border hover:border-primary/50",
                      photoPreview && "p-2"
                    )}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Upload preview" className="w-full aspect-square object-cover rounded-md" />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload your photo</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WebP • Max 5MB</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Output Style</Label>
                    <Select value={outputStyle} onValueChange={setOutputStyle} disabled={isGenerating}>
                      <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OUTPUT_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Preserve Likeness: {LIKENESS_LABELS[likeness]}</Label>
                    <Slider value={[likeness]} onValueChange={([v]) => setLikeness(v)} min={0} max={2} step={1} className="mt-2" disabled={isGenerating} />
                  </div>

                  <div><Label>Accessories (optional)</Label><Input value={photoAccessories} onChange={e => setPhotoAccessories(e.target.value)} placeholder="Sunglasses, chains, headphones..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>
                  <div><Label>Background Style (optional)</Label><Input value={backgroundStyle} onChange={e => setBackgroundStyle(e.target.value)} placeholder="Studio, neon city, abstract..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} /></div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant={hdMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHdMode(!hdMode)}
                      disabled={isGenerating}
                      className={cn(hdMode && "bg-primary text-primary-foreground")}
                    >
                      {hdMode ? "HD On" : "HD Off"}
                    </Button>
                    <span className="text-xs text-muted-foreground">{hdMode ? "40 credits" : "25 credits"}</span>
                  </div>
                </TabsContent>
              </Tabs>

              <Button className="w-full gradient-accent neon-glow-subtle" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building Identity...</> : <><Sparkles className="h-4 w-4 mr-2" />{costLabel}</>}
              </Button>
              {!canAfford && !creditsLoading && <p className="text-xs text-destructive text-center">Not enough credits. <Link to="/wallet" className="underline">Buy more</Link></p>}
              {isGenerating && <p className="text-xs text-muted-foreground text-center">Generating… credits will be deducted once complete</p>}
            </CardContent>
          </Card>

          {/* Results */}
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

                {/* Post-generation actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setResult(null); handleGenerate(); }} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Regenerate</Button>
                  <Button size="sm" variant="outline" onClick={() => { setResult(null); setOutputStyle(OUTPUT_STYLES[(OUTPUT_STYLES.findIndex(s => s.value === outputStyle) + 1) % OUTPUT_STYLES.length].value); }} className="gap-1.5"><Wand2 className="h-3.5 w-3.5" />New Style</Button>
                  <Button size="sm" variant="outline" asChild className="gap-1.5"><Link to="/ai-video"><Video className="h-3.5 w-3.5" />Use in Video</Link></Button>
                </div>

                {result.name_suggestions?.length > 0 && (
                  <Card className="glass"><CardHeader className="pb-2"><CardTitle className="text-sm">Name Suggestions</CardTitle></CardHeader>
                    <CardContent><div className="space-y-2">{result.name_suggestions.map((name, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30">
                        <span className="font-medium text-foreground">{name}</span>
                        <Button variant="ghost" size="sm" onClick={() => copy(name)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    ))}</div></CardContent>
                  </Card>
                )}
                {result.tagline && (
                  <Card className="glass"><CardHeader className="pb-2"><div className="flex justify-between"><CardTitle className="text-sm">Tagline</CardTitle><Button variant="ghost" size="sm" onClick={() => copy(result.tagline)}><Copy className="h-3 w-3" /></Button></div></CardHeader>
                    <CardContent><p className="text-sm italic text-primary">"{result.tagline}"</p></CardContent>
                  </Card>
                )}
                {result.bio && (
                  <Card className="glass"><CardHeader className="pb-2"><div className="flex justify-between"><CardTitle className="text-sm">Bio</CardTitle><Button variant="ghost" size="sm" onClick={() => copy(result.bio)}><Copy className="h-3 w-3" /></Button></div></CardHeader>
                    <CardContent><p className="text-sm text-foreground/80">{result.bio}</p></CardContent>
                  </Card>
                )}
                {result.visual_theme && (
                  <Card className="glass"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Visual Theme</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-foreground/80">{result.visual_theme}</p></CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreditConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={executeGenerate}
        creditCost={cost}
        currentCredits={aiCredits}
        summary={mode === "vision" ? "Generate artist identity from your vision" : `Photo recreate (${hdMode ? "HD" : "Standard"}) — ${OUTPUT_STYLES.find(s => s.value === outputStyle)?.label}`}
      />
    </Layout>
  );
}
