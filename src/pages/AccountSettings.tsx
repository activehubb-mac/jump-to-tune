import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { 
  User, Settings, Shield, CreditCard, Bell, LogOut, 
  Loader2, ChevronRight, Trash2, Info, RefreshCw, Eye
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useFanLoyalty } from "@/hooks/useFanLoyalty";

declare const __BUILD_TIMESTAMP__: string;
import { EmailVerificationCard } from "@/components/account/EmailVerificationCard";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { NotificationPreferencesCard } from "@/components/account/NotificationPreferencesCard";
import { TestNotificationButton } from "@/components/account/TestNotificationButton";

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, role, signOut, isLoading } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const { loyaltyEntries, toggleVisibility } = useFanLoyalty();

  const clearAudioCache = async () => {
    setIsClearingCache(true);
    try {
      if ('caches' in window) {
        await caches.delete('audio-cache');
      }
      // Also clear localStorage recently played/viewed
      localStorage.removeItem('jumtunes_recently_played');
      localStorage.removeItem('jumtunes_recently_viewed');
      
      showFeedback({
        type: "success",
        title: "Cache cleared",
        message: "Audio cache has been cleared. Try playing a track again.",
        autoClose: true,
        autoCloseDelay: 2000,
      });
      // Reload to ensure clean state
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error("Failed to clear cache:", e);
      showFeedback({
        type: "error",
        title: "Failed",
        message: "Could not clear cache. Please try again.",
        autoClose: true,
      });
      setIsClearingCache(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    showFeedback({
      type: "success",
      title: "Signed Out",
      message: "You have been signed out successfully",
      autoClose: true,
      autoCloseDelay: 2000,
    });
    navigate("/");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const settingsLinks = [
    {
      icon: Bell,
      label: "Notification Settings",
      description: "Manage email and push notifications",
      href: "/settings/notifications",
    },
    {
      icon: CreditCard,
      label: "Wallet & Payments",
      description: "Manage your credits and payment methods",
      href: "/wallet",
    },
    {
      icon: Shield,
      label: "Subscription",
      description: "View and manage your subscription plan",
      href: "/subscription",
    },
  ];

  return (
    <Layout>
      <DeleteAccountModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal} 
      />
      <ProfileEditModal
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.display_name || ""} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">
                  {profile?.display_name || "Unknown User"}
                </h2>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <span className="text-xs text-primary capitalize">{role || "fan"}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditProfile(true)}
                className="shrink-0"
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Email Verification */}
          <EmailVerificationCard />

          {/* Push Notifications */}
          <NotificationPreferencesCard />
          
          {/* Test Notification */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground text-sm">Test Notifications</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send a test notification to verify everything works
                </p>
              </div>
              <TestNotificationButton />
            </div>
          </div>

          {/* Settings Links */}
          <div className="glass-card divide-y divide-glass-border">
            {settingsLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(link.href)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{link.label}</p>
                    <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Superfan Visibility */}
          {loyaltyEntries && loyaltyEntries.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground text-sm">Superfan Visibility</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                When enabled, your level badge appears on artist pages and you're eligible for Top Supporter leaderboards.
              </p>
              <div className="space-y-2">
                {loyaltyEntries.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Show status publicly</span>
                    <Switch
                      checked={entry.show_public}
                      onCheckedChange={(v) => toggleVisibility.mutate({ artistId: entry.artist_id, showPublic: v })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-glass-border hover:bg-muted/50"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Sign Out
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>

          {/* Troubleshooting */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground text-sm">Audio Playback Issues?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clear cached audio files to fix playback problems
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAudioCache}
                disabled={isClearingCache}
                className="shrink-0"
              >
                {isClearingCache ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1.5">Clear Cache</span>
              </Button>
            </div>
          </div>

          {/* Version Info */}
          <div className="pt-4 border-t border-glass-border">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>
                Build: {new Date(__BUILD_TIMESTAMP__).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
