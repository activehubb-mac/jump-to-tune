import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDownload } from "@/hooks/useDownload";
import { useWallet } from "@/hooks/useWallet";
import { useInstantPurchase, isInsufficientCreditsError } from "@/hooks/useInstantPurchase";
import { InstantPurchaseModal } from "@/components/wallet/InstantPurchaseModal";
import { InsufficientCreditsModal } from "@/components/wallet/InsufficientCreditsModal";
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
  const { balance } = useWallet();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const priceCents = Math.round(track.price * 100);

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

    // Check if user has enough credits
    if (balance >= priceCents) {
      // Show instant purchase confirmation
      setShowPurchaseModal(true);
    } else {
      // Show insufficient credits modal
      setShowInsufficientModal(true);
    }
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

      <InstantPurchaseModal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        track={track}
      />

      <InsufficientCreditsModal
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
        requiredCents={priceCents}
        trackTitle={track.title}
      />
    </>
  );
}
