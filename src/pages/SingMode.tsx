import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Mic2, ArrowLeft, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSingModeTrack } from "@/hooks/useSingMode";
import { useAICredits } from "@/hooks/useAICredits";
import { SingModeRecorder } from "@/components/sing-mode/SingModeRecorder";
import { SingModeExport } from "@/components/sing-mode/SingModeExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Stage = "intro" | "recording" | "export";

export default function SingMode() {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: singTrack, isLoading } = useSingModeTrack(trackId);
  const { aiCredits, refetch: refetchCredits } = useAICredits();
  const [stage, setStage] = useState<Stage>("intro");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [trackMeta, setTrackMeta] = useState<{ title: string; artist_name: string } | null>(null);
  const [isDeducting, setIsDeducting] = useState(false);

  const singCost = 5;
  const canAfford = aiCredits >= singCost;

  // Fetch track metadata
  useEffect(() => {
    if (!trackId) return;
    supabase
      .from("tracks")
      .select("title, artist_id, profiles:artist_id(display_name)")
      .eq("id", trackId)
      .single()
      .then(({ data }) => {
        if (data) {
          const artistName =
            (data as any).profiles?.display_name || "Unknown Artist";
          setTrackMeta({ title: data.title, artist_name: artistName });
        }
      });
  }, [trackId]);

  const handleStartRecording = async () => {
    if (!user || !trackId) return;

    setIsDeducting(true);
    try {
      // Deduct credits
      const { data, error } = await supabase.rpc("deduct_ai_credits", {
        p_user_id: user.id,
        p_credits: singCost,
      });

      if (error) throw error;
      const result = data as any;

      if (!result.success) {
        toast.error(`Not enough credits. You need ${singCost} credits.`);
        return;
      }

      // Log usage
      await supabase.from("ai_credit_usage").insert({
        user_id: user.id,
        action: "sing_mode",
        credits_used: singCost,
        metadata: { track_id: trackId },
      });

      refetchCredits();
      setStage("recording");
    } catch (err) {
      toast.error("Failed to deduct credits");
    } finally {
      setIsDeducting(false);
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setRecordingBlob(blob);
    setStage("export");
  };

  // Not logged in
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Sign in to use Sing Mode</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!singTrack) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Mic2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sing Mode Not Available</h1>
          <p className="text-muted-foreground mb-6">
            This track doesn't have Sing Mode enabled by the artist.
          </p>
          <Button variant="outline" onClick={() => navigate(-1)} className="border-border">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  // Intro stage
  if (stage === "intro") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="glass-card p-6 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Mic2 className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">Sing Mode</h1>
              <p className="text-muted-foreground mt-1">
                {trackMeta?.title || "Loading..."}
              </p>
              <p className="text-sm text-muted-foreground">
                by {trackMeta?.artist_name || "..."}
              </p>
            </div>

            <div className="glass-card p-4 space-y-2 text-left">
              <p className="text-sm text-foreground font-medium">How it works:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Record audio or selfie video</li>
                <li>Sing along with synced lyrics</li>
                <li>Export for TikTok, Reels, or Shorts</li>
                <li>Share with JumTunes.com watermark</li>
              </ul>
            </div>

            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-sm text-foreground">Cost</span>
              <span className="text-sm font-bold text-primary">{singCost} AI Credits</span>
            </div>

            {!canAfford ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">
                  You have {aiCredits} credits. You need {singCost}.
                </p>
                <Button asChild className="w-full bg-primary text-primary-foreground">
                  <Link to="/wallet">
                    <CreditCard className="w-4 h-4 mr-2" /> Get Credits
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartRecording}
                disabled={isDeducting}
                className="w-full bg-primary text-primary-foreground"
                size="lg"
              >
                {isDeducting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mic2 className="w-4 h-4 mr-2" />
                )}
                Sing This Song
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Recording stage
  if (stage === "recording") {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <SingModeRecorder
          instrumentalUrl={singTrack.instrumental_url}
          lyrics={singTrack.lyrics || ""}
          trackTitle={trackMeta?.title || ""}
          artistName={trackMeta?.artist_name || ""}
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setStage("intro")}
        />
      </div>
    );
  }

  // Export stage
  if (stage === "export" && recordingBlob) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-md">
          <SingModeExport
            recordingBlob={recordingBlob}
            trackId={trackId!}
            trackTitle={trackMeta?.title || ""}
            onDone={() => navigate(-1)}
            onRetry={() => {
              setRecordingBlob(null);
              setStage("recording");
            }}
          />
        </div>
      </Layout>
    );
  }

  return null;
}
