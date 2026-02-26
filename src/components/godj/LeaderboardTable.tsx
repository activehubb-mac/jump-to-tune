import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Headphones, Flame } from "lucide-react";
import { DJBadge } from "./DJBadge";

interface LeaderboardEntry {
  id: string;
  artist_id: string;
  period: string;
  listener_count: number;
  reaction_count: number;
  session_count: number;
  rank: number;
  artist_name?: string;
  artist_avatar?: string;
}

function useLeaderboard(period: string) {
  return useQuery({
    queryKey: ["dj-leaderboard", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dj_leaderboard")
        .select("*")
        .eq("period", period)
        .order("rank", { ascending: true })
        .limit(20);

      if (error) throw error;

      // Fetch profile data for leaderboard entries
      if (data && data.length > 0) {
        const artistIds = data.map((d) => d.artist_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", artistIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        return data.map((entry) => {
          const profile = profileMap.get(entry.artist_id);
          return {
            ...entry,
            artist_name: profile?.display_name || "DJ",
            artist_avatar: profile?.avatar_url || null,
          };
        }) as LeaderboardEntry[];
      }

      return [] as LeaderboardEntry[];
    },
  });
}

export function LeaderboardTable() {
  return (
    <Tabs defaultValue="lifetime">
      <TabsList className="glass mb-4">
        <TabsTrigger value="lifetime" className="gap-1.5">
          <Trophy className="w-3.5 h-3.5" /> Lifetime
        </TabsTrigger>
        <TabsTrigger value="monthly" className="gap-1.5">
          <Flame className="w-3.5 h-3.5" /> Monthly
        </TabsTrigger>
      </TabsList>

      <TabsContent value="lifetime">
        <LeaderboardList period="lifetime" />
      </TabsContent>
      <TabsContent value="monthly">
        <LeaderboardList period="monthly" />
      </TabsContent>
    </Tabs>
  );
}

function LeaderboardList({ period }: { period: string }) {
  const { data: entries, isLoading } = useLeaderboard(period);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Leaderboard coming soon</p>
        <p className="text-xs mt-1">Start a Go DJ session to appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 p-3 rounded-lg glass-card"
        >
          <span className={`w-8 text-center font-bold text-lg ${
            entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-gray-300" : entry.rank === 3 ? "text-amber-600" : "text-muted-foreground"
          }`}>
            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
          </span>

          {entry.artist_avatar ? (
            <img src={entry.artist_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Headphones className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{entry.artist_name}</p>
            <p className="text-xs text-muted-foreground">
              {entry.listener_count.toLocaleString()} listeners • {entry.session_count} sessions
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-primary">{entry.reaction_count}</p>
            <p className="text-[10px] text-muted-foreground">reactions</p>
          </div>
        </div>
      ))}
    </div>
  );
}
