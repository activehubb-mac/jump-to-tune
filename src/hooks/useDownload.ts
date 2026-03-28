import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { isNativeApp, openExternalUrl, openPaymentUrl, getMobileHeaders } from "@/lib/platformBrowser";
import { isNative } from "@/lib/platform";

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

      if (isNativeApp()) {
        await openExternalUrl(data.downloadUrl);
        showFeedback({ type: "success", title: "Download Ready", message: "Choose 'Save to Files' when prompted" });
      } else {
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

  /**
   * Web-only: creates a Stripe checkout session for track purchase.
   * On native this should not be called; use native IAP instead.
   */
  const createPaymentCheckout = async ({ trackId, trackTitle, trackPrice }: DownloadOptions, tipAmount: number) => {
    if (isNative()) {
      console.warn("[Checkout] createPaymentCheckout called on native — use native billing instead");
      return null;
    }

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

  /**
   * Web-only: creates a Stripe subscription checkout.
   * On native this should not be called; use native IAP subscriptions instead.
   */
  const createSubscriptionCheckout = async (tier: "fan" | "artist" | "label") => {
    if (isNative()) {
      console.warn("[Checkout] createSubscriptionCheckout called on native — use native billing instead");
      return null;
    }

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
