import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: "platform" | "artist";
  badge_key: string;
  tier: "gold" | "silver";
  artist_id: string | null;
  product_id: string | null;
  metadata: Record<string, any>;
  is_public: boolean;
  awarded_at: string;
}

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async (): Promise<UserBadge[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges" as any)
        .select("*")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as UserBadge[]) || [];
    },
    enabled: !!userId,
  });
}

export function useToggleBadgeVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ badgeId, isPublic }: { badgeId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from("user_badges" as any)
        .update({ is_public: isPublic } as any)
        .eq("id", badgeId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    },
  });
}
