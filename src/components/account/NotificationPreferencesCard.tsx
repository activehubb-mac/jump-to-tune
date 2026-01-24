import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Loader2, Smartphone, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationPreferencesCard() {
  const { 
    isSupported, 
    isEnabled, 
    isLoading, 
    requestPermission,
    disableNotifications 
  } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (isEnabled) {
        await disableNotifications();
      } else {
        await requestPermission();
      }
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
          isEnabled ? "bg-primary/20" : "bg-muted/50"
        }`}>
          {isEnabled ? (
            <Bell className="w-6 h-6 text-primary" />
          ) : (
            <BellOff className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Push Notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isEnabled 
              ? "You'll receive notifications for new releases, purchases, and updates"
              : "Enable push notifications to stay updated on new releases and purchases"
            }
          </p>

          {!isSupported && (
            <div className="flex items-center gap-2 mt-3 text-sm text-amber-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Push notifications are not supported in this browser</span>
            </div>
          )}

          {isSupported && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                <span>{isEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex items-center gap-3">
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : null}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isToggling || !isSupported}
                />
              </div>
            </div>
          )}

          {!isEnabled && isSupported && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggle}
              disabled={isToggling}
              className="mt-4"
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Enable Notifications
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
