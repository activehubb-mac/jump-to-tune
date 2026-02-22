import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, ImageIcon, Trash2, Check, Music2 } from "lucide-react";
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
import { PROFILE_FONTS } from "@/lib/profileFonts";
import { Switch } from "@/components/ui/switch";
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
  const { showFeedback } = useFeedbackSafe();

  const [displayName, setDisplayName] = useState("");
  const [displayNameFont, setDisplayNameFont] = useState("Inter");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { uploadBanner, removeBanner, isUploading: isBannerUploading, isRemoving: isBannerRemoving, progress: bannerProgress } = useBannerUpload({
    userId: user?.id || "",
    onSuccess: async (url) => {
      setBannerUrl(url);
      await refreshProfile();
      showFeedback({
        type: "success",
        title: url ? "Banner Updated" : "Banner Removed",
        message: url ? "Your profile banner has been updated." : "Your profile banner has been removed.",
        autoClose: true,
        autoCloseDelay: 3000,
      });
    },
    onError: (error) => {
      showFeedback({
        type: "error",
        title: "Action Failed",
        message: error.message || "Failed to update banner.",
      });
    },
  });

  // Sync state with profile when modal opens
  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setDisplayNameFont(profile.display_name_font || "Inter");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
      setBannerUrl(profile.banner_image_url);
      setSocialLinks((profile as any).social_links || {});
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

  const handleBannerRemove = async () => {
    await removeBanner();
  };

  const isBannerProcessing = isBannerUploading || isBannerRemoving;

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        display_name_font: displayNameFont,
        bio: bio.trim() || null,
        social_links: socialLinks,
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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-4 sm:px-6">
        <SheetHeader className="text-left pr-6">
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
            <div
              className={cn(
                "relative w-full h-24 rounded-lg overflow-hidden group",
                "bg-muted/50 border border-glass-border"
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
                  "absolute inset-0 bg-black/50 flex items-center justify-center gap-2",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  isBannerProcessing && "opacity-100"
                )}
              >
                {isBannerProcessing ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-xs text-white">
                      {isBannerRemoving ? "Removing..." : `${bannerProgress}%`}
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isBannerProcessing}
                      className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 transition-colors"
                    >
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-xs text-white">Change</span>
                    </button>
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={handleBannerRemove}
                        disabled={isBannerProcessing}
                        className="flex flex-col items-center gap-1 p-2 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                        <span className="text-xs text-white">Remove</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 1920×480px or wider aspect ratio
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

          {/* Name Style / Font Selector */}
          <div className="space-y-3">
            <Label>Name Style</Label>
            <p className="text-xs text-muted-foreground">
              Choose how your name appears on your profile
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
              {PROFILE_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setDisplayNameFont(font.id)}
                  className={cn(
                    "relative p-3 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    displayNameFont === font.id
                      ? "border-primary bg-primary/10"
                      : "border-glass-border bg-muted/30"
                  )}
                >
                  <span
                    className="text-base sm:text-lg text-foreground truncate block"
                    style={{ fontFamily: `'${font.id}', sans-serif` }}
                  >
                    {displayName || "Your Name"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {font.label}
                  </span>
                  {displayNameFont === font.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label>Social Links</Label>
            <p className="text-xs text-muted-foreground">
              Add your links so fans can find you everywhere
            </p>
            {[
              { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
              { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
              { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
              { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
              { key: "apple_music", label: "Apple Music", placeholder: "https://music.apple.com/..." },
              { key: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/..." },
              { key: "booking", label: "Booking Email", placeholder: "booking@example.com" },
            ].map((platform) => (
              <div key={platform.key}>
                <Label className="text-xs text-muted-foreground">{platform.label}</Label>
                <Input
                  value={(socialLinks as Record<string, string>)?.[platform.key] || ""}
                  onChange={(e) => setSocialLinks((prev: Record<string, string>) => ({ ...prev, [platform.key]: e.target.value }))}
                  placeholder={platform.placeholder}
                  className="bg-muted/50 border-glass-border mt-1"
                />
              </div>
            ))}
          </div>

          {/* Spotify Embed Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-primary" />
              <Label>Spotify Player Embed</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Embed a Spotify player on your profile. Uses official Spotify embeds only.
            </p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-glass-border">
              <div>
                <p className="text-sm font-medium text-foreground">Show Spotify Player on Profile</p>
                <p className="text-xs text-muted-foreground">Fans can listen without leaving JumTunes</p>
              </div>
              <Switch
                checked={!!socialLinks?.show_spotify_embed}
                onCheckedChange={(checked) =>
                  setSocialLinks((prev) => ({ ...prev, show_spotify_embed: checked ? "true" : "" }))
                }
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Spotify Playlist URL (optional)</Label>
              <Input
                value={socialLinks?.spotify_playlist || ""}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, spotify_playlist: e.target.value }))}
                placeholder="https://open.spotify.com/playlist/..."
                className="bg-muted/50 border-glass-border mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Spotify Track URL (optional)</Label>
              <Input
                value={socialLinks?.spotify_track || ""}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, spotify_track: e.target.value }))}
                placeholder="https://open.spotify.com/track/..."
                className="bg-muted/50 border-glass-border mt-1"
              />
            </div>
            {socialLinks?.spotify && !socialLinks.spotify.includes("open.spotify.com") && socialLinks.spotify.trim() && (
              <p className="text-xs text-destructive">Please use a valid Spotify URL (https://open.spotify.com/...)</p>
            )}
          </div>


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
