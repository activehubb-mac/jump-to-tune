import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DownloadOptions {
  trackId: string;
  trackTitle: string;
  trackPrice: number;
}

export function useDownload() {
  const { session } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadOwnedTrack = async (trackId: string) => {
    if (!session) {
      toast.error("Please sign in to download");
      return;
    }

    setIsDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("download-track", {
        body: { trackId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Trigger browser download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to download track");
    } finally {
      setIsDownloading(false);
    }
  };

  const createPaymentCheckout = async ({ trackId, trackTitle, trackPrice }: DownloadOptions, tipAmount: number) => {
    if (!session) {
      toast.error("Please sign in to purchase");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mode: "payment",
          trackId,
          trackTitle,
          trackPrice,
          tipAmount,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      return data.url as string;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create checkout");
      return null;
    }
  };

  const createSubscriptionCheckout = async (tier: "fan" | "artist" | "label") => {
    if (!session) {
      toast.error("Please sign in to subscribe");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mode: "subscription",
          tier,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      return data.url as string;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create checkout");
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast.error("Please sign in to manage subscription");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      return data.url as string;
    } catch (err) {
      console.error("Portal error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to open subscription portal");
      return null;
    }
  };

  return {
    downloadOwnedTrack,
    createPaymentCheckout,
    createSubscriptionCheckout,
    openCustomerPortal,
    isDownloading,
  };
}
