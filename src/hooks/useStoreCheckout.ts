import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";
import { getMobileHeaders, openPaymentUrl } from "@/lib/platformBrowser";

export function useStoreCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { showFeedback } = useFeedbackSafe();
  const { user } = useAuth();

  const checkout = async (productId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { ...getMobileHeaders() };

      // Add auth header if logged in
      if (user) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          headers.Authorization = `Bearer ${sessionData.session.access_token}`;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-store-checkout", {
        headers,
        body: { productId, quantity },
      });

      if (error) throw error;
      if (data?.url) {
        await openPaymentUrl(data.url);
      } else {
        throw new Error(data?.error || "No checkout URL received");
      }
    } catch (err) {
      showFeedback({
        type: "error",
        title: "Checkout Failed",
        message: err instanceof Error ? err.message : "Failed to start checkout",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading };
}
