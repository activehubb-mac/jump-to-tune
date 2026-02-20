import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LEVEL_THRESHOLDS = [
  { level: "founding_superfan", points: 1000 },
  { level: "elite", points: 500 },
  { level: "insider", points: 150 },
  { level: "supporter", points: 50 },
  { level: "listener", points: 0 },
];

const DEFAULT_LEVEL_NAMES: Record<string, string> = {
  listener: "Listener",
  supporter: "Supporter",
  insider: "Insider",
  elite: "Elite",
  founding_superfan: "Founding Superfan",
};

export function getLevelFromPoints(points: number): string {
  for (const t of LEVEL_THRESHOLDS) {
    if (points >= t.points) return t.level;
  }
  return "listener";
}

export function getNextLevel(currentLevel: string) {
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t.level === currentLevel);
  if (idx <= 0) return null; // already max or not found
  return LEVEL_THRESHOLDS[idx - 1];
}

export function getLevelThreshold(level: string): number {
  return LEVEL_THRESHOLDS.find((t) => t.level === level)?.points ?? 0;
}

export function getLevelDisplayName(level: string, customNames?: Record<string, string> | null): string {
  if (customNames && customNames[level]) return customNames[level];
  return DEFAULT_LEVEL_NAMES[level] || level;
}

export function useFanLoyalty(artistId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: loyaltyEntries, isLoading } = useQuery({
    queryKey: ["fan-loyalty", user?.id, artistId],
    queryFn: async () => {
      let query = (supabase
        .from("fan_loyalty" as any)
        .select("*") as any)
        .eq("fan_id", user!.id);

      if (artistId) {
        query = query.eq("artist_id", artistId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ artistId, showPublic }: { artistId: string; showPublic: boolean }) => {
      const { error } = await (supabase
        .from("fan_loyalty" as any)
        .update({ show_public: showPublic } as any) as any)
        .eq("fan_id", user!.id)
        .eq("artist_id", artistId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fan-loyalty"] });
    },
  });

  // Aggregate stats across all artists
  const totalPoints = loyaltyEntries?.reduce((sum, e) => sum + (e.points || 0), 0) ?? 0;
  const highestLevel = loyaltyEntries?.length
    ? loyaltyEntries.reduce((best, e) => {
        const bestPts = getLevelThreshold(best);
        const ePts = getLevelThreshold(e.level);
        return ePts > bestPts ? e.level : best;
      }, "listener")
    : "listener";

  // Single entry for specific artist
  const entry = artistId ? loyaltyEntries?.[0] ?? null : null;

  return {
    loyaltyEntries,
    entry,
    totalPoints,
    highestLevel,
    isLoading,
    toggleVisibility,
  };
}

export function useArtistFanLoyalty(artistId?: string) {
  return useQuery({
    queryKey: ["artist-fan-loyalty", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_loyalty" as any)
        .select("*")
        .eq("artist_id", artistId!);
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });
}
