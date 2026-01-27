import { useRef, useState, ReactNode } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBannerUpload } from "@/hooks/useBannerUpload";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface BannerUploadProps {
  userId: string;
  currentBannerUrl?: string | null;
  onBannerChange?: (url: string) => void;
  onUploadSuccess?: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function BannerUpload({
  userId,
  currentBannerUrl,
  onBannerChange,
  onUploadSuccess,
  children,
  className,
}: BannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { showFeedback } = useFeedbackSafe();

  const { uploadBanner, isUploading, progress } = useBannerUpload({
    userId,
    onSuccess: async (url) => {
      setPreviewUrl(null);
      onBannerChange?.(url);
      await onUploadSuccess?.();
      showFeedback({
        type: "success",
        title: "Banner Updated",
        message: "Your profile banner has been updated successfully.",
        autoClose: true,
        autoCloseDelay: 3000,
      });
    },
    onError: (error) => {
      setPreviewUrl(null);
      showFeedback({
        type: "error",
        title: "Upload Failed",
        message: error.message || "Failed to upload banner. Please try again.",
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
    await uploadBanner(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentBannerUrl;

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

      {/* Background with optional banner image */}
      <div className="absolute inset-0">
        {displayUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${displayUrl})` }}
          />
        )}
        {children}
      </div>

      {/* Upload button overlay - visible on hover */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "cursor-pointer focus:outline-none focus:opacity-100",
          isUploading && "opacity-100"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-white">
            <Camera className="w-8 h-8" />
            <span className="text-sm font-medium">Change Banner</span>
          </div>
        )}
      </button>
    </div>
  );
}
