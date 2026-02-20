import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMessageThreads(artistId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["message-threads", user?.id, artistId],
    queryFn: async () => {
      let query = supabase.from("message_threads").select("*").order("created_at", { ascending: false });
      if (artistId) {
        query = query.eq("artist_id", artistId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ artistId, message }: { artistId: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke("send-paid-message", {
        body: { artistId, message },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      queryClient.invalidateQueries({ queryKey: ["message-credits"] });
    },
  });

  const replyToThread = useMutation({
    mutationFn: async ({ threadId, reply }: { threadId: string; reply: string }) => {
      const { error } = await supabase
        .from("message_threads")
        .update({ reply, status: "replied", replied_at: new Date().toISOString() } as any)
        .eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
    },
  });

  return { threads, isLoading, sendMessage, replyToThread };
}
