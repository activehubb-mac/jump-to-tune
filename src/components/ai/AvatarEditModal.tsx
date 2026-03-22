import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Wand2, Paintbrush, RefreshCw, Upload, UserCheck, Save, History, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useDefaultIdentity } from "@/hooks/useDefaultIdentity";
import { useAvatarVersions } from "@/hooks/useAvatarVersions";
import { supabase } from "@/integrations/supabase/client";
import { CreditConfirmModal } from "@/components/ai/CreditConfirmModal";
import { AI_TOOL_PRICING } from "@/lib/aiPricing";
import { AvatarVersionHistory } from "./AvatarVersionHistory";
import { cn } from "@/lib/utils";

const OUTPUT_STYLES = [
  { value: "realistic", label: "Realistic" },
  { value: "futuristic", label: "Futuristic" },
  { value: "animated", label: "Animated" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "luxury", label: "Luxury" },
];

const LIKENESS_LABELS = ["Low", "Medium", "High"];

interface AvatarEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identityId: string;
  currentAvatarUrl: string | null;
}

export function AvatarEditModal({ open, onOpenChange, identityId, currentAvatarUrl }: AvatarEditModalProps) {
  const { user } = useAuth();
  const { aiCredits, refetch } = useAICredits();
  const { showFeedback } = useFeedbackSafe();
  const { setDefaultIdentity } = useDefaultIdentity();
  const { invalidate } = useAvatarVersions(identityId);

  const [editMode, setEditMode] = useState<"quick" | "style" | "full">("quick");
  const [accessories, setAccessories] = useState("");
  const [background, setBackground] = useState("");
  const [outputStyle, setOutputStyle] = useState("realistic");
  const [likeness, setLikeness] = useState(1);
  const [hdMode, setHdMode] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tiers = AI_TOOL_PRICING.avatar_edit?.tiers ?? [];
  const cost = editMode === "quick" ? 10 : editMode === "style" ? 15 : 25;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showFeedback({ type: "error", title: "File too large", message: "Max 5MB." });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (aiCredits < cost) {
      showFeedback({ type: "error", title: "Insufficient Credits", message: `Need ${cost} credits.` });
      return;
    }
    setConfirmOpen(true);
  };

  const executeGenerate = async () => {
    setConfirmOpen(false);
    setIsGenerating(true);
    setResultImage(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      let photo_base64: string | null = null;
      if (editMode === "full" && photoFile) {
        const reader = new FileReader();
        photo_base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
      }

      const { data, error } = await supabase.functions.invoke("ai-avatar-edit", {
        body: {
          edit_mode: editMode,
          identity_id: identityId,
          accessories,
          background,
          output_style: outputStyle,
          photo_base64,
          preserve_likeness: LIKENESS_LABELS[likeness].toLowerCase(),
          hd: hdMode,
        },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) {
        let msg = "Edit failed.";
        try { const b = JSON.parse(error.context?.body); if (b.error) msg = b.error; } catch {}
        showFeedback({ type: "error", title: "Failed", message: msg });
        return;
      }

      setResultImage(data.avatar_image);
      refetch();
      invalidate();
      showFeedback({ type: "success", title: "Avatar Updated! ✨", message: `Used ${data.credits_used} credits.`, autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetAsProfile = async () => {
    if (!resultImage || !user) return;
    try {
      let avatarUrl = resultImage;
      if (avatarUrl.startsWith("data:")) {
        const base64Data = avatarUrl.split(",")[1];
        const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `${user.id}/edit-${Date.now()}.png`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(fileName, byteArray, { contentType: "image/png", upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
      await setDefaultIdentity(identityId);
      showFeedback({ type: "success", title: "Profile Updated!", message: "Avatar set as profile picture.", autoClose: true });
    } catch (err) {
      showFeedback({ type: "error", title: "Failed", message: err instanceof Error ? err.message : "Could not update." });
    }
  };

  if (showHistory) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="h-5 w-5 text-primary" /> Version History
            </DialogTitle>
          </DialogHeader>
          <AvatarVersionHistory identityId={identityId} onBack={() => setShowHistory(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Paintbrush className="h-5 w-5 text-primary" /> Edit Avatar
            </DialogTitle>
            <DialogDescription>
              Modify your avatar without losing previous versions
            </DialogDescription>
          </DialogHeader>

          {/* Current avatar reference */}
          {currentAvatarUrl && !resultImage && (
            <div className="flex justify-center">
              <img src={currentAvatarUrl} alt="Current avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
            </div>
          )}

          {/* Result comparison */}
          {resultImage && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 justify-center">
                {currentAvatarUrl && (
                  <div className="text-center">
                    <img src={currentAvatarUrl} alt="Previous" className="w-20 h-20 rounded-full object-cover border border-border opacity-60" />
                    <p className="text-[10px] text-muted-foreground mt-1">Previous</p>
                  </div>
                )}
                <div className="text-center">
                  <img src={resultImage} alt="New" className="w-28 h-28 rounded-full object-cover border-2 border-primary ring-2 ring-primary/20" />
                  <p className="text-[10px] text-primary mt-1 font-medium">New</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button size="sm" onClick={handleSetAsProfile} className="gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> Set as Profile
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowHistory(true)} className="gap-1.5">
                  <History className="h-3.5 w-3.5" /> View Versions
                </Button>
                <Button size="sm" variant="outline" onClick={() => setResultImage(null)} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Edit Again
                </Button>
              </div>
            </div>
          )}

          {!resultImage && (
            <div className="space-y-4">
              <Tabs value={editMode} onValueChange={(v) => setEditMode(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="quick" className="flex-1 text-xs gap-1">
                    <Wand2 className="h-3 w-3" /> Quick · {tiers[0]?.credits ?? 10}cr
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex-1 text-xs gap-1">
                    <Paintbrush className="h-3 w-3" /> Style · {tiers[1]?.credits ?? 15}cr
                  </TabsTrigger>
                  <TabsTrigger value="full" className="flex-1 text-xs gap-1">
                    <RefreshCw className="h-3 w-3" /> Full · {tiers[2]?.credits ?? 25}cr
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quick" className="space-y-3 mt-3">
                  <p className="text-xs text-muted-foreground">Adjust accessories and background. Face and likeness are fully preserved.</p>
                  <div>
                    <Label className="text-sm">Accessories</Label>
                    <Input value={accessories} onChange={e => setAccessories(e.target.value)} placeholder="Sunglasses, chains, headphones..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} />
                  </div>
                  <div>
                    <Label className="text-sm">Background</Label>
                    <Input value={background} onChange={e => setBackground(e.target.value)} placeholder="Studio, neon city, abstract..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} />
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-3 mt-3">
                  <p className="text-xs text-muted-foreground">Change overall aesthetic while maintaining core likeness.</p>
                  <div>
                    <Label className="text-sm">Output Style</Label>
                    <Select value={outputStyle} onValueChange={setOutputStyle} disabled={isGenerating}>
                      <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OUTPUT_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Accessories (optional)</Label>
                    <Input value={accessories} onChange={e => setAccessories(e.target.value)} placeholder="Sunglasses, chains..." className="mt-1 bg-muted/50 border-border" disabled={isGenerating} />
                  </div>
                </TabsContent>

                <TabsContent value="full" className="space-y-3 mt-3">
                  <p className="text-xs text-muted-foreground">Upload a new photo or fully regenerate your avatar.</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} disabled={isGenerating} />
                  <div
                    onClick={() => !isGenerating && fileRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors border-border hover:border-primary/50",
                      photoPreview && "p-1"
                    )}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Upload" className="w-full aspect-square object-cover rounded-md max-h-40" />
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">New photo (optional)</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Output Style</Label>
                    <Select value={outputStyle} onValueChange={setOutputStyle} disabled={isGenerating}>
                      <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OUTPUT_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Preserve Likeness: {LIKENESS_LABELS[likeness]}</Label>
                    <Slider value={[likeness]} onValueChange={([v]) => setLikeness(v)} min={0} max={2} step={1} className="mt-2" disabled={isGenerating} />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="gap-1.5 text-muted-foreground">
                  <History className="h-3.5 w-3.5" /> History
                </Button>
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <Zap className="h-3 w-3 mr-1" />{aiCredits}
                </Badge>
              </div>

              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || aiCredits < cost}>
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />
                    {editMode === "quick" ? "Quick Edit" : editMode === "style" ? "Style Shift" : "Full Recreate"} — {cost} credits
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreditConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={executeGenerate}
        creditCost={cost}
        currentCredits={aiCredits}
        summary={`${editMode === "quick" ? "Quick Edit" : editMode === "style" ? "Style Shift" : "Full Recreate"} your avatar`}
      />
    </>
  );
}
