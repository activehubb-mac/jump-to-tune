import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useDJSessionsByStatus } from "@/hooks/useDJSessions";
import { SessionCard } from "@/components/godj/SessionCard";
import { LeaderboardTable } from "@/components/godj/LeaderboardTable";
import { MixSessionCard } from "@/components/godj-mix/MixSessionCard";
import { MixWizard } from "@/components/godj-mix/MixWizard";
import { useGoDJProfile } from "@/hooks/useGoDJProfile";
import { usePublishedGoDJSessions } from "@/hooks/useGoDJSessions";
import { useAuth } from "@/contexts/AuthContext";
import { Disc3, Flame, Rocket, Clock, Trophy, Sparkles, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function GoDJ() {
  const { user } = useAuth();
  const { data: djProfile } = useGoDJProfile(user?.id);
  const { data: publishedMixes, isLoading: mixesLoading } = usePublishedGoDJSessions(12);
  const [showWizard, setShowWizard] = useState(false);
  const { data: activeSessions, isLoading: activeLoading } = useDJSessionsByStatus("active", 12);
  const { data: scheduledSessions, isLoading: scheduledLoading } = useDJSessionsByStatus("scheduled", 8);

  // Fetch artist profiles for session cards
  const allArtistIds = [
    ...(activeSessions?.map((s) => s.artist_id) || []),
    ...(scheduledSessions?.map((s) => s.artist_id) || []),
  ];
  const uniqueArtistIds = [...new Set(allArtistIds)];

  const { data: artistProfiles } = useQuery({
    queryKey: ["dj-artist-profiles", uniqueArtistIds.join(",")],
    queryFn: async () => {
      if (!uniqueArtistIds.length) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", uniqueArtistIds);

      const map: Record<string, { name: string; avatar: string | null }> = {};
      data?.forEach((p) => {
        map[p.id] = { name: p.display_name || "DJ", avatar: p.avatar_url };
      });
      return map;
    },
    enabled: uniqueArtistIds.length > 0,
  });

  const { data: tierData } = useQuery({
    queryKey: ["dj-tiers-batch", uniqueArtistIds.join(",")],
    queryFn: async () => {
      if (!uniqueArtistIds.length) return {};
      const { data } = await supabase
        .from("dj_tiers")
        .select("artist_id, current_tier")
        .in("artist_id", uniqueArtistIds);

      const map: Record<string, number> = {};
      data?.forEach((t) => { map[t.artist_id] = t.current_tier; });
      return map;
    },
    enabled: uniqueArtistIds.length > 0,
  });

  const profiles = artistProfiles || {};
  const tiers = tierData || {};

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Disc3 className="w-4 h-4" />
            Go DJ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Discover Curated Sessions
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore playlists curated by rising DJs. Listen, react, and support the curators shaping the sound.
          </p>
        </div>

        {/* Trending Sessions */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-2xl font-bold text-foreground">Trending Sessions</h2>
          </div>
          {activeLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : activeSessions && activeSessions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  artistName={profiles[session.artist_id]?.name}
                  artistAvatar={profiles[session.artist_id]?.avatar || undefined}
                  tier={tiers[session.artist_id]}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Disc3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No active sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start a Go DJ session!</p>
            </div>
          )}
        </section>

        {/* Upcoming Drops */}
        {scheduledSessions && scheduledSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Upcoming Drops</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {scheduledSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  artistName={profiles[session.artist_id]?.name}
                  artistAvatar={profiles[session.artist_id]?.avatar || undefined}
                  tier={tiers[session.artist_id]}
                />
              ))}
            </div>
          </section>
        )}

        {/* Leaderboard */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
          </div>
          <div className="max-w-2xl">
            <LeaderboardTable />
          </div>
        </section>
      </div>
    </Layout>
  );
}
