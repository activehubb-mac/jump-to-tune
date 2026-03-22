import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Sparkles, ArrowLeft, CreditCard, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStageTrack, getAvailableModes, type StageMode } from "@/hooks/useStage";
import { useAICredits } from "@/hooks/useAICredits";
import { StageModePicker } from "@/components/stage/StageModePicker";
import { StageTemplatePicker, type StageTemplate } from "@/components/stage/StageTemplatePicker";
import { StageRecorder } from "@/components/stage/StageRecorder";
import { StageExport } from "@/components/stage/StageExport";
import { AvatarStylePicker, type AvatarStyle, type SceneBackground, getAvatarPrompt } from "@/components/stage/AvatarStylePicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Stage = "intro" | "recording" | "export" | "ai_generating";

const CREDIT_COSTS: Record<StageMode, number> = { sing: 5, duet: 8, dance: 5, rap: 5, ai_avatar: 40 };

export default function StagePage() {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stageTrack, isLoading } = useStageTrack(trackId);
  const { aiCredits, refetch: refetchCredits } = useAICredits();
  const [stage, setStage] = useState<Stage>("intro");
  const [selectedMode, setSelectedMode] = useState<StageMode | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<StageTemplate>("spotlight");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [trackMeta, setTrackMeta] = useState<{ title: string; artist_name: string } | null>(null);
  const [isDeducting, setIsDeducting] = useState(false);

  // AI Avatar state
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("cyber_dj");
  const [sceneBackground, setSceneBackground] = useState<SceneBackground>("concert_stage");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");

  const availableModes = getAvailableModes(stageTrack);
  const currentCost = selectedMode ? CREDIT_COSTS[selectedMode] : 0;
  const canAfford = aiCredits >= currentCost;

  useEffect(() => {
    if (!trackId) return;
    supabase
      .from("tracks")
      .select("title, artist_id, profiles:artist_id(display_name)")
      .eq("id", trackId)
      .single()
      .then(({ data }) => {
        if (data) {
          setTrackMeta({ title: data.title, artist_name: (data as any).profiles?.display_name || "Unknown Artist" });
        }
      });
  }, [trackId]);

  useEffect(() => {
    if (availableModes.length > 0 && !selectedMode) {
      setSelectedMode(availableModes[0]);
    }
  }, [availableModes, selectedMode]);

  const handleStartRecording = async () => {
    if (!user || !trackId || !selectedMode) return;
    setIsDeducting(true);
    try {
      const { data, error } = await supabase.rpc("deduct_ai_credits", { p_user_id: user.id, p_credits: currentCost });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast.error(`Not enough credits. You need ${currentCost} credits.`);
        return;
      }
      await supabase.from("ai_credit_usage").insert({ user_id: user.id, action: `stage_${selectedMode}`, credits_used: currentCost, metadata: { track_id: trackId } });
      refetchCredits();

      if (selectedMode === "ai_avatar") {
        await handleAIAvatarGeneration();
      } else {
        setStage("recording");
      }
    } catch {
      toast.error("Failed to deduct credits");
    } finally {
      setIsDeducting(false);
    }
  };

  const handleAIAvatarGeneration = async () => {
    if (!trackId || !user) return;
    setStage("ai_generating");
    setIsGeneratingAvatar(true);
    setGenerationProgress("Generating AI avatar performance...");

    try {
      const { avatarPrompt, scenePrompt } = getAvatarPrompt(avatarStyle, sceneBackground);
      const { data, error } = await supabase.functions.invoke("ai-avatar-performance", {
        body: {
          trackId,
          trackTitle: trackMeta?.title || "",
          artistName: trackMeta?.artist_name || "",
          avatarStyle,
          sceneBackground,
          avatarPrompt,
          scenePrompt,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data?.videoUrl) {
        // Fetch the video as a blob for the export flow
        const resp = await fetch(data.videoUrl);
        const blob = await resp.blob();
        setRecordingBlob(blob);
        setStage("export");
        toast.success("AI Avatar performance generated!");
      } else if (data?.imageUrl) {
        // If we got an image, create a simple video-like blob
        const resp = await fetch(data.imageUrl);
        const blob = await resp.blob();
        setRecordingBlob(blob);
        setStage("export");
        toast.success("AI Avatar visual generated!");
      } else {
        throw new Error("No output received");
      }
    } catch (err: any) {
      console.error("AI Avatar generation failed:", err);
      toast.error("AI Avatar generation failed. Credits have been refunded.");
      // Refund credits
      await supabase.rpc("add_ai_credits", { p_user_id: user.id, p_credits: currentCost });
      refetchCredits();
      setStage("intro");
    } finally {
      setIsGeneratingAvatar(false);
      setGenerationProgress("");
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setRecordingBlob(blob);
    setStage("export");
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Sign in to use JumTunes Stage</p>
          <Button asChild className="bg-primary text-primary-foreground"><Link to="/auth">Sign In</Link></Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return <Layout><div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!stageTrack) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Stage Not Available</h1>
          <p className="text-muted-foreground mb-6">This track doesn't have JumTunes Stage enabled.</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="border-border"><ArrowLeft className="w-4 h-4 mr-2" /> Go Back</Button>
        </div>
      </Layout>
    );
  }

  // AI generating stage
  if (stage === "ai_generating") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 max-w-md text-center">
          <div className="glass-card p-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Generating AI Avatar</h2>
            <p className="text-muted-foreground">{generationProgress}</p>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-xs text-muted-foreground">This may take a moment...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Recording stage - fullscreen
  if (stage === "recording" && selectedMode) {
    return (
      <div className="fixed inset-0 z-50">
        <StageRecorder
          instrumentalUrl={stageTrack.instrumental_url}
          lyrics={stageTrack.lyrics || ""}
          trackTitle={trackMeta?.title || ""}
          artistName={trackMeta?.artist_name || ""}
          mode={selectedMode}
          template={selectedTemplate}
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setStage("intro")}
        />
      </div>
    );
  }

  // Export stage
  if (stage === "export" && recordingBlob && selectedMode) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-md">
          <StageExport
            recordingBlob={recordingBlob}
            trackId={trackId!}
            trackTitle={trackMeta?.title || ""}
            artistName={trackMeta?.artist_name || ""}
            mode={selectedMode}
            template={selectedTemplate}
            onDone={() => navigate(-1)}
            onRetry={() => {
              setRecordingBlob(null);
              if (selectedMode === "ai_avatar") {
                setStage("intro");
              } else {
                setStage("recording");
              }
            }}
          />
        </div>
      </Layout>
    );
  }

  // Intro stage
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <div className="glass-card p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Performance</h1>
            <p className="text-muted-foreground mt-1">{trackMeta?.title || "Loading..."}</p>
            <p className="text-sm text-muted-foreground">by {trackMeta?.artist_name || "..."}</p>
          </div>

          {/* Mode Picker */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Choose your mode</p>
            <StageModePicker availableModes={availableModes} selectedMode={selectedMode} onSelect={setSelectedMode} />
          </div>

          {/* AI Avatar Options */}
          {selectedMode === "ai_avatar" && (
            <AvatarStylePicker
              selectedStyle={avatarStyle}
              onStyleChange={setAvatarStyle}
              selectedScene={sceneBackground}
              onSceneChange={setSceneBackground}
            />
          )}

          {/* Template Picker (for non-avatar modes) */}
          {selectedMode && selectedMode !== "ai_avatar" && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Stage template</p>
              <StageTemplatePicker selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </div>
          )}

          {/* Cost */}
          {selectedMode && (
            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-sm text-foreground">Cost</span>
              <span className="text-sm font-bold text-primary">{currentCost} AI Credits</span>
            </div>
          )}

          {/* Action */}
          {selectedMode && !canAfford ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive text-center">You have {aiCredits} credits. You need {currentCost}.</p>
              <Button asChild className="w-full bg-primary text-primary-foreground">
                <Link to="/wallet"><CreditCard className="w-4 h-4 mr-2" /> Get Credits</Link>
              </Button>
            </div>
          ) : selectedMode ? (
            <Button onClick={handleStartRecording} disabled={isDeducting || isGeneratingAvatar} className="w-full bg-primary text-primary-foreground" size="lg">
              {isDeducting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : selectedMode === "ai_avatar" ? <Bot className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {selectedMode === "ai_avatar" ? "Generate AI Performance" : "Start Performance"}
            </Button>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
