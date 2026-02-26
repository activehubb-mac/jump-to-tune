import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useDJSessionDetail } from "@/hooks/useDJSessions";
import { useDJReactions } from "@/hooks/useDJReactions";
import { useDJListenerCount, useDJSessionTracks } from "@/hooks/useDJListeners";
import { useDJTier } from "@/hooks/useDJTiers";
import { ReactionBar } from "@/components/godj/ReactionBar";
import { SessionTrackList } from "@/components/godj/SessionTrackList";
import { LoginWallModal } from "@/components/godj/LoginWallModal";
import { DJBadge } from "@/components/godj/DJBadge";
import { CountdownTimer } from "@/components/godj/CountdownTimer";
import { Badge } from "@/components/ui/badge";
import { Disc3, Headphones, Loader2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function GoDJSession() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [showLoginWall, setShowLoginWall] = useState(false);

  const { data: session, isLoading } = useDJSessionDetail(sessionId);
  const { reactions, userReaction, react, isReacting } = useDJReactions(sessionId);
  const { data: listenerCount } = useDJListenerCount(sessionId);
  const { data: tracks } = useDJSessionTracks(sessionId);
  const { data: tier } = useDJTier(session?.artist_id);

  // Fetch artist profile
  const { data: artist } = useQuery({
    queryKey: ["dj-session-artist", session?.artist_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", session!.artist_id)
        .single();
      return data;
    },
    enabled: !!session?.artist_id,
  });

  // 30-second preview wall for non-authenticated users
  useEffect(() => {
    if (user) return;
    const timer = setTimeout(() => {
      setShowLoginWall(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [user]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Disc3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Session not found</h1>
        </div>
      </Layout>
    );
  }

  const isScheduled = session.status === "scheduled" && session.scheduled_at;

  return (
    <Layout>
      <LoginWallModal open={showLoginWall} onOpenChange={setShowLoginWall} />

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Session Header */}
        <div className="space-y-4">
          {/* Cover Image */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted/30 relative">
            {session.cover_image_url ? (
              <img src={session.cover_image_url} alt={session.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                <Disc3 className="w-20 h-20 text-primary/30" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              {isScheduled ? (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">⏳ Upcoming</Badge>
              ) : session.status === "active" ? (
                <Badge className="bg-green-500/90 text-white">🔴 Live</Badge>
              ) : (
                <Badge variant="secondary">Archived</Badge>
              )}
              {session.gating !== "public" && (
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                  {session.gating === "followers" ? "Followers" : session.gating === "superfan" ? "Superfan" : "Limited"}
                </Badge>
              )}
            </div>
          </div>

          {/* Title & Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{session.title}</h1>
            {session.description && (
              <p className="text-muted-foreground mt-2">{session.description}</p>
            )}
          </div>

          {/* Artist & Stats */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link to={`/artist/${session.artist_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {artist?.avatar_url ? (
                <img src={artist.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{artist?.display_name || "DJ"}</p>
                {tier && <DJBadge tier={tier.current_tier} className="text-[10px]" />}
              </div>
            </Link>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Headphones className="w-4 h-4" />
                <span>{listenerCount || 0} listeners</span>
              </div>
            </div>
          </div>

          {/* Countdown for scheduled */}
          {isScheduled && session.scheduled_at && (
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Starts in</p>
              <CountdownTimer targetDate={session.scheduled_at} className="justify-center text-lg" />
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className="glass-card p-4">
          <ReactionBar
            reactions={reactions}
            userReaction={userReaction}
            onReact={react}
            disabled={!user || isReacting}
          />
          {!user && (
            <p className="text-xs text-muted-foreground mt-2">Sign in to react</p>
          )}
        </div>

        {/* Track List */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-primary" />
            Tracklist
          </h3>
          <SessionTrackList tracks={tracks || []} />
        </div>
      </div>
    </Layout>
  );
}
