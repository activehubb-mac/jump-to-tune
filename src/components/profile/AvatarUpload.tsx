import { useRef, useState } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarChange?: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const iconSizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onAvatarChange,
  size = "md",
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { showFeedback } = useFeedbackSafe();

  const { uploadAvatar, isUploading, progress } = useAvatarUpload({
    userId,
    onSuccess: (url) => {
      setPreviewUrl(null);
      onAvatarChange?.(url);
      showFeedback({
        type: "success",
        title: "Avatar Updated",
        message: "Your profile picture has been updated successfully.",
        autoClose: true,
        autoCloseDelay: 3000,
      });
    },
    onError: (error) => {
      setPreviewUrl(null);
      showFeedback({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Failed to upload avatar. Please try again.",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    await uploadAvatar(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={cn("relative group", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "relative rounded-full overflow-hidden transition-all duration-200",
          "bg-muted flex items-center justify-center",
          "hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          sizeClasses[size]
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn("text-muted-foreground", iconSizeClasses[size])} />
        )}

        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isUploading && "opacity-100"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <span className="text-xs text-white">{progress}%</span>
            </div>
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </button>
    </div>
  );
}
