import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LabelInvite {
  id: string;
  label_id: string;
  status: string;
  joined_at: string;
  label: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useLabelInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending invites for current artist
  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["label-invites", user?.id],
    queryFn: async (): Promise<LabelInvite[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("label_roster")
        .select(`
          id,
          label_id,
          status,
          joined_at,
          label:profiles!label_roster_label_id_fkey(id, display_name, avatar_url)
        `)
        .eq("artist_id", user.id)
        .eq("status", "pending")
        .order("joined_at", { ascending: false });

      if (error) throw error;

      return (data as unknown as LabelInvite[]) ?? [];
    },
    enabled: !!user?.id,
  });

  // Accept invitation
  const acceptInvite = useMutation({
    mutationFn: async (rosterId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("label_roster")
        .update({ status: "active" })
        .eq("id", rosterId)
        .eq("artist_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-invites"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Decline invitation
  const declineInvite = useMutation({
    mutationFn: async (rosterId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("label_roster")
        .update({ status: "declined" })
        .eq("id", rosterId)
        .eq("artist_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-invites"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    invites,
    isLoading,
    acceptInvite,
    declineInvite,
    pendingCount: invites.length,
  };
}
