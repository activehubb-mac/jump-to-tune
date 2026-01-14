import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Earning {
  id: string;
  purchase_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  artist_payout_cents: number;
  status: "pending" | "paid" | "failed";
  created_at: string;
}

interface PayoutStatus {
  stripe_connected: boolean;
  stripe_account_status: "not_connected" | "pending" | "active" | "restricted";
  stripe_payouts_enabled: boolean;
  stripe_account_details: {
    details_submitted: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    requirements: string[];
  } | null;
  pending_earnings_cents: number;
  paid_earnings_cents: number;
  total_earnings_cents: number;
  recent_earnings: Earning[];
}

export function useStripeConnect() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<PayoutStatus>({
    queryKey: ["stripe-connect", user?.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("artist-payout-status", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user && (role === "artist" || role === "label"),
    staleTime: 60000, // 1 minute
  });

  const startOnboarding = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Please sign in to set up payouts");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to start onboarding");
        return null;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const openDashboard = useCallback(async () => {
    if (!data?.stripe_connected || data?.stripe_account_status !== "active") {
      toast.error("Please complete Stripe onboarding first");
      return null;
    }

    return startOnboarding(); // This will return a login link for active accounts
  }, [data, startOnboarding]);

  return {
    isConnected: data?.stripe_connected ?? false,
    accountStatus: data?.stripe_account_status ?? "not_connected",
    payoutsEnabled: data?.stripe_payouts_enabled ?? false,
    accountDetails: data?.stripe_account_details,
    pendingEarnings: data?.pending_earnings_cents ?? 0,
    pendingEarningsDollars: (data?.pending_earnings_cents ?? 0) / 100,
    paidEarnings: data?.paid_earnings_cents ?? 0,
    paidEarningsDollars: (data?.paid_earnings_cents ?? 0) / 100,
    totalEarnings: data?.total_earnings_cents ?? 0,
    totalEarningsDollars: (data?.total_earnings_cents ?? 0) / 100,
    recentEarnings: data?.recent_earnings ?? [],
    isLoading,
    error,
    refetch,
    startOnboarding,
    openDashboard,
    isConnecting,
  };
}
