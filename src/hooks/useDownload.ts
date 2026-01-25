import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Browser } from "@capacitor/browser";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

interface DownloadOptions {
  trackId: string;
  trackTitle: string;
  trackPrice: number;
}

export function useDownload() {
  const { session } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadCoverUrl, setDownloadCoverUrl] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Trigger haptic feedback helper
  const triggerHaptic = useCallback(async (type: "start" | "complete" | "error") => {
    if (!isNative) return;
    try {
      if (type === "start") {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (type === "complete") {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === "error") {
        await Haptics.notification({ type: NotificationType.Error });
      }
    } catch {
      // Haptics not available
    }
  }, [isNative]);

  const downloadOwnedTrack = async (trackId: string, coverUrl?: string | null) => {
    if (!session) {
      showFeedback({ type: "error", title: "Sign In Required", message: "Please sign in to download" });
      return;
    }

    // Trigger start haptic
    await triggerHaptic("start");

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadComplete(false);
    setDownloadCoverUrl(coverUrl || null);
    
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
      setDownloadFilename(filename);

      // Check if running on native platform
      if (isNative) {
        // Show progress modal on native
        setShowProgressModal(true);
        
        try {
          // Fetch with progress tracking using XMLHttpRequest
          const xhr = new XMLHttpRequest();
          
          const downloadPromise = new Promise<Blob>((resolve, reject) => {
            xhr.open("GET", downloadUrl, true);
            xhr.responseType = "blob";
            
            xhr.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                setDownloadProgress(percent);
                
                // Haptic feedback at milestones
                if (percent >= 50 && percent < 51) {
                  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                }
              }
            };
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
              } else {
                reject(new Error(`Download failed: ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send();
          });
          
          const blob = await downloadPromise;
          setDownloadProgress(90);
          
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

          setDownloadProgress(100);
          setDownloadComplete(true);
          await triggerHaptic("complete");
          
          // Auto-close after showing complete state
          setTimeout(() => {
            setShowProgressModal(false);
            showFeedback({ 
              type: "success", 
              title: "Download Complete", 
              message: `"${filename}" saved to Documents folder` 
            });
          }, 1500);
        } catch (fsError) {
          console.error("Filesystem download error:", fsError);
          setShowProgressModal(false);
          await triggerHaptic("error");
          
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
      await triggerHaptic("error");
      setShowProgressModal(false);
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
    // Download progress state for native modal
    downloadProgress,
    downloadFilename,
    showProgressModal,
    setShowProgressModal,
    downloadComplete,
    downloadCoverUrl,
  };
}
