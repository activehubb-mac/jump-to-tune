import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useWaitlist(productId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: waitlistCount = 0 } = useQuery({
    queryKey: ["waitlist-count", productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("drop_waitlists")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!productId,
  });

  const { data: isOnWaitlist = false } = useQuery({
    queryKey: ["waitlist-status", productId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drop_waitlists")
        .select("id")
        .eq("product_id", productId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!productId && !!user,
  });

  const joinWaitlist = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("drop_waitlists")
        .insert({ product_id: productId!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist-count", productId] });
      queryClient.invalidateQueries({ queryKey: ["waitlist-status", productId, user?.id] });
    },
  });

  const leaveWaitlist = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("drop_waitlists")
        .delete()
        .eq("product_id", productId!)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist-count", productId] });
      queryClient.invalidateQueries({ queryKey: ["waitlist-status", productId, user?.id] });
    },
  });

  return { waitlistCount, isOnWaitlist, joinWaitlist, leaveWaitlist };
}
