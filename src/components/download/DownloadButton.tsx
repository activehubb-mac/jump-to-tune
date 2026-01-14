import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDownload } from "@/hooks/useDownload";
import { TipPaymentModal } from "./TipPaymentModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  cover_art_url?: string | null;
  price: number;
  audio_url: string;
  artist?: {
    display_name: string | null;
  };
}

interface DownloadButtonProps {
  track: Track;
  isOwned?: boolean;
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadButton({
  track,
  isOwned = false,
  variant = "ghost",
  size = "icon",
  className,
}: DownloadButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { downloadOwnedTrack, isDownloading } = useDownload();

  const [showTipModal, setShowTipModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if user is logged in
    if (!user) {
      toast.info("Please sign in to download tracks");
      navigate("/auth");
      return;
    }

    // If user owns the track, download directly
    if (isOwned) {
      downloadOwnedTrack(track.id);
      return;
    }

    // Go directly to payment - no subscription check needed for downloads
    setShowTipModal(true);
  };

  const isLoading = isDownloading;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {size !== "icon" && <span className="ml-2">Download</span>}
      </Button>

      <TipPaymentModal
        open={showTipModal}
        onOpenChange={setShowTipModal}
        track={track}
      />
    </>
  );
}
