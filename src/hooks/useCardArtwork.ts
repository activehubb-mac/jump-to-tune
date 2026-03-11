import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseCardArtworkOptions {
  cardId: string;
  prompt: string;
  enabled?: boolean;
}

export function useCardArtwork({ cardId, prompt, enabled = true }: UseCardArtworkOptions) {
  return useQuery({
    queryKey: ["card-artwork", cardId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-card-artwork", {
        body: { card_id: cardId, prompt },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.image_url as string;
    },
    enabled,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24h
    retry: 1,
  });
}
