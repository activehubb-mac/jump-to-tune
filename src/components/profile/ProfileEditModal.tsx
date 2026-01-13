import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "./AvatarUpload";
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
  const { showFeedback, closeFeedback } = useFeedback();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with profile when modal opens
  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [open, profile]);

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
