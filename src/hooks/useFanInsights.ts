import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FanInsightEntry {
  fan_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_spent: number;
  purchase_count: number;
  last_purchase: string | null;
  subscription_status: string | null;
  loyalty_level: string;
  loyalty_points: number;
}

export interface FanInsightsResult {
  top_supporters: FanInsightEntry[];
  rising_supporters: FanInsightEntry[];
  at_risk_subscribers: FanInsightEntry[];
  fans_near_next_level: FanInsightEntry[];
}

export function useFanInsights() {
  const [insights, setInsights] = useState<FanInsightsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fan-insights");
      if (fnError) throw fnError;
      setInsights(data as FanInsightsResult);
    } catch (e: any) {
      const msg = e?.message || "Failed to fetch insights";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { insights, isLoading, error, fetchInsights };
}
