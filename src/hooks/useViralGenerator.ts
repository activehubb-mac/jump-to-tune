import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useAICredits } from "@/hooks/useAICredits";

interface ViralAsset {
  id: string;
  user_id: string;
  track_id: string;
  asset_type: string;
  style: string;
  duration_seconds: number;
  file_url: string | null;
  caption_text: string | null;
  hook_text: string | null;
  hashtag_set: string[];
  status: string;
  created_at: string;
}

interface GenerateParams {
  track_id: string;
  asset_type: string;
  duration_seconds: number;
  style: string;
}

export function useViralGenerator(trackId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refetch: refetchCredits } = useAICredits();

  const { data: assets = [], isLoading } = useQuery<ViralAsset[]>({
    queryKey: ["viral-assets", trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from("ai_viral_assets")
        .select("*")
        .eq("track_id", trackId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ViralAsset[]) || [];
    },
    enabled: !!user && !!trackId,
  });

  const generateMutation = useMutation({
    mutationFn: async (params: GenerateParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("ai-viral-generator", {
        body: params,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        let msg = "Generation failed";
        try {
          const parsed = JSON.parse(error.context?.body || "{}");
          if (parsed.error) msg = parsed.error;
        } catch {}
        throw new Error(msg);
      }

      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["viral-assets", trackId] });
      refetchCredits();
      toast.success(`Viral content queued! Used ${data.credits_used} credits.`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    assets,
    isLoading,
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
}
