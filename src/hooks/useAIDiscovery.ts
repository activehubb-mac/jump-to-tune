import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiscoveryTrack {
  id: string;
  title: string;
  cover_art_url: string | null;
  price: number;
  genre: string | null;
  mood_tags: string[] | null;
  audio_url: string | null;
  duration: number | null;
  artist_id: string;
  artist_name: string;
}

interface DiscoveryResult {
  description: string;
  filters: { genres: string[]; moods: string[] };
  tracks: DiscoveryTrack[];
}

export function useAIDiscovery() {
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const search = async (query: string) => {
    if (query.trim().length < 3) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fan-discovery", {
        body: { query },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as DiscoveryResult);
    } catch (err: any) {
      toast.error(err.message || "Discovery failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const clear = () => setResult(null);

  return { result, isSearching, search, clear };
}
