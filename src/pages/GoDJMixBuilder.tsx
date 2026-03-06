import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoDJSessionDetail, usePublishGoDJSession, useUpdateGoDJSession } from "@/hooks/useGoDJSessions";
import { useGoDJSegments } from "@/hooks/useGoDJSegments";
import { useAuth } from "@/contexts/AuthContext";
import { MixBuilder } from "@/components/godj-mix/MixBuilder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Disc3, Loader2, Save, Upload } from "lucide-react";

export default function GoDJMixBuilder() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: session, isLoading } = useGoDJSessionDetail(sessionId);
  const { data: segments = [] } = useGoDJSegments(sessionId);
  const publishSession = usePublishGoDJSession();
  const updateSession = useUpdateGoDJSession();

  const handlePublish = async () => {
    if (!sessionId) return;

    // Validate: at least 1 track segment
    const trackSegments = segments.filter(s => s.segment_type === "track");
    if (trackSegments.length === 0) {
      toast({ title: "Add at least 1 track", description: "Your mix needs at least one JumTunes track", variant: "destructive" });
      return;
    }

    // Standard mode validation: voice clips must be between tracks
    if (session?.mode === "standard") {
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].segment_type === "voice") {
          const prev = segments[i - 1];
          const next = segments[i + 1];
          if ((!prev || prev.segment_type !== "track") && (!next || next.segment_type !== "track")) {
            toast({
              title: "Invalid voice placement",
              description: "In Standard mode, voice clips must be placed between tracks",
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    try {
      // Deduct 5 AI credits for publishing a mix
      const { data: deductResult, error: deductError } = await supabase.rpc("deduct_ai_credits", {
        p_user_id: user!.id,
        p_credits: 5,
      });

      if (deductError || !deductResult?.success) {
        toast({
          title: "Insufficient AI Credits",
          description: `You need 5 credits to publish a mix. You have ${deductResult?.current_credits ?? 0}.`,
          variant: "destructive",
        });
        return;
      }

      // Record usage
      await supabase.from("ai_credit_usage").insert({
        user_id: user!.id,
        action: "dj_mix_publish",
        credits_used: 5,
        metadata: { session_id: sessionId },
      });

      await publishSession.mutateAsync(sessionId);
      toast({ title: "Mix Published!", description: "Your mix is now live (5 credits used)" });
      navigate(`/go-dj/mix/${sessionId}`);
    } catch (err: any) {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!session) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Session not found</p></div></Layout>;
  }

  // Only owner can access editor
  if (user?.id !== session.dj_user_id) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">You don't have access to edit this session</p></div></Layout>;
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    rendering: "bg-yellow-500/20 text-yellow-400",
    published: "bg-green-500/20 text-green-400",
    failed: "bg-destructive/20 text-destructive",
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link to={`/artist/${user.id}`} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Disc3 className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{session.title}</h1>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${statusColors[session.status] || ""}`}>
                  {session.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {session.mode === "pro" ? "Pro DJ" : "Standard"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session.status === "published" && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/go-dj/mix/${sessionId}`)}>
                View Published
              </Button>
            )}
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishSession.isPending || segments.length === 0}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {publishSession.isPending ? "Publishing…" : "Publish Mix"}
            </Button>
          </div>
        </div>

        {/* Mix Builder */}
        <MixBuilder session={session} />
      </div>
    </Layout>
  );
}
