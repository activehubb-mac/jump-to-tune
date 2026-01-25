import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Check if running in Capacitor native app
const isNativeApp = () => {
  return typeof (window as any).Capacitor !== "undefined";
};

// Detect platform
const getPlatform = (): "ios" | "android" | "web" => {
  if (!isNativeApp()) return "web";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  return "android";
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

  // Check if push notifications are supported and current status
  useEffect(() => {
    const checkSupport = async () => {
      let isSupported = false;
      let isEnabled = false;

      if (isNativeApp()) {
        isSupported = true;
        // Check existing permission on native
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const permStatus = await PushNotifications.checkPermissions();
          isEnabled = permStatus.receive === "granted";
        } catch {
          // Capacitor not available
        }
      } else if ("Notification" in window && "serviceWorker" in navigator) {
        isSupported = true;
        isEnabled = Notification.permission === "granted";
      }

      setState(prev => ({
        ...prev,
        isSupported,
        isEnabled,
        isLoading: false,
      }));

      // If enabled, fetch existing token from DB
      if (isEnabled && user) {
        const { data } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();
        
        if (data?.token) {
          setState(prev => ({ ...prev, token: data.token }));
        }
      }
    };

    checkSupport();
  }, [user]);

  // Save push token to database
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!user) return;

    const platform = getPlatform();
    
    try {
      const { error } = await supabase
        .from("push_tokens")
        .upsert({
          user_id: user.id,
          token,
          platform,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,token",
        });

      if (error) {
        console.error("[Push] Error saving token:", error);
      } else {
        console.log("[Push] Token saved successfully");
      }
    } catch (error) {
      console.error("[Push] Error saving token:", error);
    }
  }, [user]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (isNativeApp()) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        
        const permStatus = await PushNotifications.requestPermissions();
        
        if (permStatus.receive === "granted") {
          await PushNotifications.register();
          
          // Listen for registration token
          PushNotifications.addListener("registration", async (tokenData) => {
            console.log("[Push] Registration token:", tokenData.value);
            setState(prev => ({ ...prev, token: tokenData.value, isEnabled: true }));
            await saveTokenToDatabase(tokenData.value);
          });

          // Listen for registration errors
          PushNotifications.addListener("registrationError", (error) => {
            console.error("[Push] Registration error:", error);
            toast.error("Failed to register for notifications");
          });

          // Listen for incoming notifications
          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("[Push] Notification received:", notification);
            toast(notification.title || "New notification", {
              description: notification.body,
            });
          });

          // Listen for notification taps
          PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            console.log("[Push] Notification tapped:", action);
            handleNotificationTap(action.notification.data);
          });

          setState(prev => ({ ...prev, isEnabled: true, isLoading: false }));
          toast.success("Notifications enabled!");
          return true;
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          toast.error("Notification permission denied");
          return false;
        }
      } else {
        // Web push notifications
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          // For web, generate a simple identifier
          const webToken = `web_${user?.id}_${Date.now()}`;
          await saveTokenToDatabase(webToken);
          
          setState(prev => ({ ...prev, isEnabled: true, token: webToken, isLoading: false }));
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
  }, [user, saveTokenToDatabase]);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Deactivate all tokens for this user
      await supabase
        .from("push_tokens")
        .update({ is_active: false })
        .eq("user_id", user.id);

      setState(prev => ({ 
        ...prev, 
        isEnabled: false, 
        token: null, 
        isLoading: false 
      }));
      
      toast.success("Notifications disabled");
    } catch (error) {
      console.error("[Push] Error disabling notifications:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error("Failed to disable notifications");
    }
  }, [user]);

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
    disableNotifications,
    sendLocalNotification,
  };
};
