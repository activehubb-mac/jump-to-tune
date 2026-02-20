import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SuperfanMessage {
  id: string;
  artist_id: string;
  fan_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export function useSuperfanMessages(artistId: string | undefined, fanId: string | undefined) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["superfan-messages", artistId, fanId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("superfan_messages")
        .select("*")
        .eq("artist_id", artistId!)
        .eq("fan_id", fanId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as SuperfanMessage[];
    },
    enabled: !!artistId && !!fanId,
    refetchInterval: 10000,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ message, senderId }: { message: string; senderId: string }) => {
      const { error } = await (supabase as any)
        .from("superfan_messages")
        .insert({
          artist_id: artistId!,
          fan_id: fanId!,
          sender_id: senderId,
          message,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superfan-messages", artistId, fanId] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
}
