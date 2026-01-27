import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { isNativeApp, openExternalUrl, openPaymentUrl, getMobileHeaders } from "@/lib/platformBrowser";

interface DownloadOptions {
  trackId: string;
  trackTitle: string;
  trackPrice: number;
}

export function useDownload() {
  const { session } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadOwnedTrack = async (trackId: string) => {
    if (!session) {
      showFeedback({ type: "error", title: "Sign In Required", message: "Please sign in to download" });
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

      // iOS native app: Open in browser to trigger "Save to Files"
      if (isNativeApp()) {
        await openExternalUrl(data.downloadUrl);
        showFeedback({ type: "success", title: "Download Ready", message: "Choose 'Save to Files' when prompted" });
      } else {
        // Web: Use anchor element approach
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback({ type: "success", title: "Download Started", message: "Your track is downloading" });
      }
    } catch (err) {
      console.error("Download error:", err);
      showFeedback({ type: "error", title: "Download Failed", message: err instanceof Error ? err.message : "Failed to download track" });
    } finally {
      setIsDownloading(false);
    }
  };

  const createPaymentCheckout = async ({ trackId, trackTitle, trackPrice }: DownloadOptions, tipAmount: number) => {
    if (!session) {
      showFeedback({ type: "error", title: "Sign In Required", message: "Please sign in to purchase" });
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
          ...getMobileHeaders(),
        },
      });

      if (error) throw error;

      return data.url as string;
    } catch (err) {
      console.error("Checkout error:", err);
      showFeedback({ type: "error", title: "Checkout Failed", message: err instanceof Error ? err.message : "Failed to create checkout" });
      return null;
    }
  };

  const createSubscriptionCheckout = async (tier: "fan" | "artist" | "label") => {
    if (!session) {
      showFeedback({ type: "error", title: "Sign In Required", message: "Please sign in to subscribe" });
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
          ...getMobileHeaders(),
        },
      });

      if (error) throw error;

      return data.url as string;
    } catch (err) {
      console.error("Checkout error:", err);
      showFeedback({ type: "error", title: "Checkout Failed", message: err instanceof Error ? err.message : "Failed to create checkout" });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      showFeedback({ type: "error", title: "Sign In Required", message: "Please sign in to manage subscription" });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...getMobileHeaders(),
        },
      });

      if (error) throw error;

      return data.url as string;
    } catch (err) {
      console.error("Portal error:", err);
      showFeedback({ type: "error", title: "Portal Error", message: err instanceof Error ? err.message : "Failed to open subscription portal" });
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
