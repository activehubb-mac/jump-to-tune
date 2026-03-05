import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AICreditsData {
  ai_credits: number;
  balance_cents: number;
}

interface AICreditCost {
  action_key: string;
  credit_cost: number;
  label: string;
  description: string | null;
  is_active: boolean;
}

export function useAICredits() {
  const { user } = useAuth();

  const { data: walletData, isLoading: isLoadingBalance, refetch } = useQuery<AICreditsData>({
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

  const { data: costs = [] } = useQuery<AICreditCost[]>({
    queryKey: ["ai-credit-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_credit_costs")
        .select("action_key, credit_cost, label, description, is_active")
        .eq("is_active", true)
        .order("credit_cost");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 300000, // 5 min cache
  });

  const getCost = (actionKey: string): number => {
    return costs.find((c) => c.action_key === actionKey)?.credit_cost ?? 0;
  };

  const canAfford = (actionKey: string): boolean => {
    const cost = getCost(actionKey);
    return (walletData?.ai_credits ?? 0) >= cost;
  };

  return {
    aiCredits: walletData?.ai_credits ?? 0,
    balanceCents: walletData?.balance_cents ?? 0,
    isLoading: isLoadingBalance,
    costs,
    getCost,
    canAfford,
    refetch,
  };
}
