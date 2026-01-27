import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Wallet, 
  Calendar, 
  Music, 
  Users, 
  Lock, 
  Loader2,
  Save,
  Info,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";

interface NotificationPreferences {
  lowBalance: boolean;
  lowBalanceThreshold: number;
  renewalReminders: boolean;
  renewalDaysBefore: number;
  newFollowers: boolean;
  trackSales: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  lowBalance: true,
  lowBalanceThreshold: 500, // $5.00 in cents
  renewalReminders: true,
  renewalDaysBefore: 7,
  newFollowers: true,
  trackSales: true,
  weeklyDigest: false,
};

// Store preferences in localStorage for now (can be moved to Supabase later)
const STORAGE_KEY = "notification_preferences";

export default function NotificationSettings() {
  const { user, role, isLoading: authLoading } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
        } catch (e) {
          console.error("Failed to parse notification preferences:", e);
        }
      }
    }
  }, [user]);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save to localStorage (can be migrated to Supabase later)
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(preferences));
      
      showFeedback({
        type: "success",
        title: "Settings Saved",
        message: "Your notification preferences have been updated.",
        autoClose: true,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      showFeedback({
        type: "error",
        title: "Save Failed",
        message: "Could not save your preferences. Please try again.",
        autoClose: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to manage your notification settings.
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isArtistOrLabel = role === "artist" || role === "label";

  return (
    <Layout>
      <TooltipProvider>
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">Notification Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Choose which alerts you'd like to receive</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Financial Alerts */}
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">Financial Alerts</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Balance and payment notifications</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Low Balance */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="low-balance" className="font-medium">Low Balance Warning</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Get notified when your credit balance falls below the threshold</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      id="low-balance"
                      checked={preferences.lowBalance}
                      onCheckedChange={(checked) => updatePreference("lowBalance", checked)}
                    />
                  </div>
                  
                  {preferences.lowBalance && (
                    <div className="pl-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">
                          Threshold: ${(preferences.lowBalanceThreshold / 100).toFixed(2)}
                        </Label>
                      </div>
                      <Slider
                        value={[preferences.lowBalanceThreshold]}
                        onValueChange={([value]) => updatePreference("lowBalanceThreshold", value)}
                        min={100}
                        max={5000}
                        step={100}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when balance drops below this amount
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Alerts */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Subscription Alerts</h2>
                  <p className="text-sm text-muted-foreground">Renewal and billing notifications</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Renewal Reminders */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="renewal" className="font-medium">Renewal Reminders</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Get reminded before your subscription renews or trial ends</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      id="renewal"
                      checked={preferences.renewalReminders}
                      onCheckedChange={(checked) => updatePreference("renewalReminders", checked)}
                    />
                  </div>
                  
                  {preferences.renewalReminders && (
                    <div className="pl-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">
                          Remind me {preferences.renewalDaysBefore} days before
                        </Label>
                      </div>
                      <Slider
                        value={[preferences.renewalDaysBefore]}
                        onValueChange={([value]) => updatePreference("renewalDaysBefore", value)}
                        min={1}
                        max={14}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Creator Alerts (Artists/Labels only) */}
            {isArtistOrLabel && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Music className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Creator Alerts</h2>
                    <p className="text-sm text-muted-foreground">Track sales and engagement</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Track Sales */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="track-sales" className="font-medium">Track Sales</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Get notified when someone purchases your tracks</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      id="track-sales"
                      checked={preferences.trackSales}
                      onCheckedChange={(checked) => updatePreference("trackSales", checked)}
                    />
                  </div>

                  {/* New Followers */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="new-followers" className="font-medium">New Followers</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Get notified when someone follows you</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      id="new-followers"
                      checked={preferences.newFollowers}
                      onCheckedChange={(checked) => updatePreference("newFollowers", checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email Digest */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Email Digest</h2>
                  <p className="text-sm text-muted-foreground">Summary notifications</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="weekly-digest" className="font-medium">Weekly Summary</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Receive a weekly email with your activity summary</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.weeklyDigest}
                  onCheckedChange={(checked) => updatePreference("weeklyDigest", checked)}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={cn(
                  "gradient-accent neon-glow-subtle",
                  !hasChanges && "opacity-50"
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-6 mt-8 border border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions that affect your account
                </p>
              </div>
            </div>
            
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">Delete Account</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full sm:w-auto shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Delete Account Modal */}
      <DeleteAccountModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal} 
      />
    </Layout>
  );
}
