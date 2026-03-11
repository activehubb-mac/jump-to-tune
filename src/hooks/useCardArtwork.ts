import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";

interface UseCardArtworkOptions {
  cardId: string;
  prompt: string;
  enabled?: boolean;
}

export function useCardArtwork({ cardId, prompt, enabled = true }: UseCardArtworkOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const query = useQuery({
    queryKey: ["card-artwork", cardId],
    queryFn: async () => {
      // Stagger to avoid burst
      await new Promise(r => setTimeout(r, Math.random() * 2000));
      const { data, error } = await supabase.functions.invoke("generate-card-artwork", {
        body: { card_id: cardId, prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.image_url as string;
    },
    enabled: enabled && isVisible,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10000),
  });

  const refCallback = useCallback((node: HTMLDivElement | null) => {
    ref.current = node;
    if (node && !isVisible) {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
        { rootMargin: "200px" }
      );
      observer.observe(node);
    }
  }, [isVisible]);

  return { ...query, ref: refCallback };
}
