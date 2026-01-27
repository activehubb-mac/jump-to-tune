import { useRef, useState, ReactNode } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBannerUpload } from "@/hooks/useBannerUpload";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface BannerUploadProps {
  userId: string;
  currentBannerUrl?: string | null;
  onBannerChange?: (url: string | null) => void;
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

  const { uploadBanner, removeBanner, isUploading, isRemoving, progress } = useBannerUpload({
    userId,
    onSuccess: async (url) => {
      setPreviewUrl(null);
      onBannerChange?.(url);
      await onUploadSuccess?.();
      showFeedback({
        type: "success",
        title: url ? "Banner Updated" : "Banner Removed",
        message: url 
          ? "Your profile banner has been updated successfully."
          : "Your profile banner has been removed.",
        autoClose: true,
        autoCloseDelay: 3000,
      });
    },
    onError: (error) => {
      setPreviewUrl(null);
      showFeedback({
        type: "error",
        title: "Action Failed",
        message: error.message || "Failed to update banner. Please try again.",
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

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await removeBanner();
  };

  const displayUrl = previewUrl || currentBannerUrl;
  const isProcessing = isUploading || isRemoving;

  return (
    <div className={cn("relative group", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isProcessing}
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
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-3",
          "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isProcessing && "opacity-100"
        )}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">
              {isRemoving ? "Removing..." : `${progress}%`}
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 text-white p-4 rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Change Banner</span>
              <span className="text-xs text-white/70">Recommended: 1920×480px</span>
            </button>
            {displayUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isProcessing}
                className="flex flex-col items-center gap-1 text-white p-4 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Trash2 className="w-8 h-8" />
                <span className="text-sm font-medium">Remove</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
