import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Browser } from "@capacitor/browser";

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

      const downloadUrl = data.downloadUrl;
      const filename = data.filename;

      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        // Native mobile: Use Filesystem plugin to download
        try {
          // Fetch the file as blob
          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error("Failed to fetch file");
          
          const blob = await response.blob();
          
          // Convert blob to base64
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Save to device
          await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
          });

          showFeedback({ 
            type: "success", 
            title: "Download Complete", 
            message: `"${filename}" saved to Documents folder` 
          });
        } catch (fsError) {
          console.error("Filesystem download error:", fsError);
          // Fallback: Open in browser for manual save
          await Browser.open({ url: downloadUrl });
          showFeedback({ 
            type: "info", 
            title: "Opening Download", 
            message: "File opened in browser for download" 
          });
        }
      } else {
        // Web: Trigger browser download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
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
      // Add mobile header for native platforms
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
      };
      
      if (Capacitor.isNativePlatform()) {
        headers["x-jumtunes-mobile"] = "true";
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mode: "payment",
          trackId,
          trackTitle,
          trackPrice,
          tipAmount,
        },
        headers,
      });

      if (error) throw error;

      const checkoutUrl = data.url as string;
      
      // Open checkout in appropriate way
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: checkoutUrl });
      } else {
        window.open(checkoutUrl, "_blank");
      }

      return checkoutUrl;
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
      // Add mobile header for native platforms
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
      };
      
      if (Capacitor.isNativePlatform()) {
        headers["x-jumtunes-mobile"] = "true";
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mode: "subscription",
          tier,
        },
        headers,
      });

      if (error) throw error;

      const checkoutUrl = data.url as string;
      
      // Open checkout in appropriate way
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: checkoutUrl });
      } else {
        window.open(checkoutUrl, "_blank");
      }

      return checkoutUrl;
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
      // Add mobile header for native platforms
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
      };
      
      if (Capacitor.isNativePlatform()) {
        headers["x-jumtunes-mobile"] = "true";
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers,
      });

      if (error) throw error;

      const portalUrl = data.url as string;
      
      // Open portal in appropriate way
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: portalUrl });
      } else {
        window.open(portalUrl, "_blank");
      }

      return portalUrl;
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
