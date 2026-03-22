import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AICreditsData {
  ai_credits: number;
  balance_cents: number;
}

export function useAICredits() {
  const { user } = useAuth();

  const { data: walletData, isLoading, refetch } = useQuery<AICreditsData>({
    queryKey: ["ai-credits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_wallets")
        .select("ai_credits, balance_cents")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? { ai_credits: 0, balance_cents: 0 };
    },
    enabled: !!user,
    staleTime: 15000,
  });

  return {
    aiCredits: walletData?.ai_credits ?? 0,
    balanceCents: walletData?.balance_cents ?? 0,
    isLoading,
    refetch,
  };
}
