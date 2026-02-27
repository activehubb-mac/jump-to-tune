import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useGoDJListenerCount(sessionId?: string) {
  return useQuery({
    queryKey: ["go-dj-listens", sessionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("go_dj_listens")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!sessionId,
  });
}

export function useRecordListen() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("go_dj_listens")
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
        });
      if (error) throw error;
    },
  });
}
