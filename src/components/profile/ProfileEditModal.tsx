import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "./AvatarUpload";
import { useBannerUpload } from "@/hooks/useBannerUpload";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { showFeedback, closeFeedback } = useFeedbackSafe();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { uploadBanner, isUploading: isBannerUploading, progress: bannerProgress } = useBannerUpload({
    userId: user?.id || "",
    onSuccess: async (url) => {
      setBannerUrl(url);
      await refreshProfile();
      showFeedback({
        type: "success",
        title: "Banner Updated",
        message: "Your profile banner has been updated.",
        autoClose: true,
        autoCloseDelay: 3000,
      });
    },
    onError: (error) => {
      showFeedback({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Failed to upload banner.",
      });
    },
  });

  // Sync state with profile when modal opens
  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
      setBannerUrl(profile.banner_image_url);
    }
  }, [open, profile]);

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadBanner(file);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", user.id);

    setIsSaving(false);

    if (error) {
      showFeedback({
        type: "error",
        title: "Failed to Save",
        message: error.message || "Could not update your profile. Please try again.",
      });
      return;
    }

    await refreshProfile();
    onOpenChange(false);

    showFeedback({
      type: "success",
      title: "Profile Updated",
      message: "Your profile has been saved successfully.",
      autoClose: true,
      autoCloseDelay: 3000,
    });
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Update your profile information visible to others.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Banner Preview */}
          <div className="space-y-2">
            <Label>Profile Banner</Label>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleBannerSelect}
              disabled={isBannerUploading}
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isBannerUploading}
              className={cn(
                "relative w-full h-24 rounded-lg overflow-hidden group",
                "bg-muted/50 border border-glass-border",
                "hover:border-primary/50 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              )}
            >
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "absolute inset-0 bg-black/50 flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  isBannerUploading && "opacity-100"
                )}
              >
                {isBannerUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-xs text-white">{bannerProgress}%</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-xs text-white">Change Banner</span>
                  </div>
                )}
              </div>
            </button>
            <p className="text-xs text-muted-foreground">
              Recommended: 1920×480 or wider aspect ratio
            </p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              onAvatarChange={setAvatarUrl}
              size="lg"
            />
            <p className="text-xs text-muted-foreground">
              Click to upload a new photo
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-muted/50 border-glass-border"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              className="bg-muted/50 border-glass-border resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-glass-border"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
