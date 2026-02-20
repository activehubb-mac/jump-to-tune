import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMessageCredits() {
  const { user } = useAuth();

  const { data: balance = 0, isLoading, refetch } = useQuery({
    queryKey: ["message-credits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_credits")
        .select("balance")
        .eq("fan_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.balance || 0;
    },
    enabled: !!user,
  });

  const purchaseCredits = async () => {
    const { data, error } = await supabase.functions.invoke("purchase-message-credits");
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return { balance, isLoading, purchaseCredits, refetch };
}
