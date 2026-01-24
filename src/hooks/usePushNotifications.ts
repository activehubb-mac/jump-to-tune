import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Check if running in Capacitor native app
const isNativeApp = () => {
  return typeof (window as any).Capacitor !== "undefined";
};

interface PushNotificationState {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  token: string | null;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isEnabled: false,
    isLoading: true,
    token: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      let isSupported = false;

      if (isNativeApp()) {
        // Capacitor native app - always supported
        isSupported = true;
      } else if ("Notification" in window && "serviceWorker" in navigator) {
        // Web push notifications
        isSupported = true;
      }

      const permission = isNativeApp() 
        ? false // Will check via Capacitor
        : Notification.permission === "granted";

      setState(prev => ({
        ...prev,
        isSupported,
        isEnabled: permission,
        isLoading: false,
      }));
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (isNativeApp()) {
        // Use Capacitor Push Notifications
        const { PushNotifications } = await import("@capacitor/push-notifications");
        
        const permStatus = await PushNotifications.requestPermissions();
        
        if (permStatus.receive === "granted") {
          // Register for push notifications
          await PushNotifications.register();
          
          // Listen for registration token
          PushNotifications.addListener("registration", async (token) => {
            console.log("[Push] Registration token:", token.value);
            setState(prev => ({ ...prev, token: token.value, isEnabled: true }));
            
            // Save token to database
            if (user) {
              await saveTokenToDatabase(token.value);
            }
          });

          // Listen for registration errors
          PushNotifications.addListener("registrationError", (error) => {
            console.error("[Push] Registration error:", error);
            toast.error("Failed to register for notifications");
          });

          // Listen for incoming notifications
          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("[Push] Notification received:", notification);
            // Show in-app notification
            toast(notification.title || "New notification", {
              description: notification.body,
            });
          });

          // Listen for notification taps
          PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            console.log("[Push] Notification tapped:", action);
            // Handle navigation based on notification data
            handleNotificationTap(action.notification.data);
          });

          setState(prev => ({ ...prev, isEnabled: true, isLoading: false }));
          return true;
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
        }
      } else {
        // Web push notifications
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          // Get service worker registration
          const registration = await navigator.serviceWorker.ready;
          
          // Subscribe to push notifications (would need VAPID keys for production)
          // For now, just enable local notifications
          setState(prev => ({ ...prev, isEnabled: true, isLoading: false }));
          toast.success("Notifications enabled!");
          return true;
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          toast.error("Notification permission denied");
          return false;
        }
      }
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error("Failed to enable notifications");
      return false;
    }
  }, [user]);

  // Save push token to database
  const saveTokenToDatabase = async (token: string) => {
    if (!user) return;

    try {
      // Store token in user's profile or a dedicated table
      // For now, log it - you can create a push_tokens table later
      console.log("[Push] Token to save:", { userId: user.id, token, platform: isNativeApp() ? "native" : "web" });
      
      // TODO: Create push_tokens table and uncomment:
      // const { error } = await supabase
      //   .from("push_tokens")
      //   .upsert({
      //     user_id: user.id,
      //     token,
      //     platform: isNativeApp() ? "native" : "web",
      //     updated_at: new Date().toISOString(),
      //   }, {
      //     onConflict: "user_id,token",
      //   });
    } catch (error) {
      console.error("[Push] Error saving token:", error);
    }
  };

  // Handle notification tap navigation
  const handleNotificationTap = (data: any) => {
    if (!data) return;

    const { type, id } = data;

    switch (type) {
      case "new_release":
        window.location.href = `/album/${id}`;
        break;
      case "purchase":
        window.location.href = "/library";
        break;
      case "follow":
        window.location.href = `/artist/${id}`;
        break;
      default:
        window.location.href = "/";
    }
  };

  // Send a local notification (for testing)
  const sendLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    if (!state.isEnabled) return;

    if (isNativeApp()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            extra: data,
          },
        ],
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, data });
    }
  }, [state.isEnabled]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
  };
};
