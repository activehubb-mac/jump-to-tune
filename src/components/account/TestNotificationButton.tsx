import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TestNotificationButton() {
  const { user } = useAuth();
  const { isEnabled, sendLocalNotification } = usePushNotifications();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleTestNotification = async () => {
    if (!user) return;

    setIsSending(true);
    setSent(false);

    try {
      // Send via edge function to create in-app notification
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: user.id,
          title: "Test Notification 🎵",
          body: "This is a test notification from JumTunes. Push notifications are working!",
          type: "general",
          data: { test: true },
        },
      });

      if (error) {
        throw error;
      }

      // Also send local notification if enabled
      if (isEnabled) {
        await sendLocalNotification(
          "Test Notification 🎵",
          "Push notifications are working correctly!"
        );
      }

      setSent(true);
      toast.success("Test notification sent! Check your notification center.");
      
      // Reset sent state after 3 seconds
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestNotification}
      disabled={isSending}
      className="w-full sm:w-auto"
    >
      {isSending ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : sent ? (
        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
      ) : (
        <Bell className="w-4 h-4 mr-2" />
      )}
      {sent ? "Sent!" : "Send Test Notification"}
    </Button>
  );
}