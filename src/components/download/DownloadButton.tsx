import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useCollectionBookmarks } from "@/hooks/useCollectionBookmarks";
import { useDownload } from "@/hooks/useDownload";
import { SubscriptionRequiredModal } from "./SubscriptionRequiredModal";
import { DownloadOptionsModal } from "./DownloadOptionsModal";
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
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscription();
  const { addBookmark, isAdding } = useCollectionBookmarks();
  const { downloadOwnedTrack, isDownloading } = useDownload();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
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

    // Check subscription status
    if (!hasActiveSubscription && !subscriptionLoading) {
      setShowSubscriptionModal(true);
      return;
    }

    // Show download options
    setShowOptionsModal(true);
  };

  const handleAddToCollection = () => {
    addBookmark(track.id);
    toast.success("Added to collection!");
  };

  const handleDownloadToDevice = () => {
    setShowTipModal(true);
  };

  const isLoading = subscriptionLoading || isDownloading || isAdding;

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

      <SubscriptionRequiredModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
      />

      <DownloadOptionsModal
        open={showOptionsModal}
        onOpenChange={setShowOptionsModal}
        track={track}
        onAddToCollection={handleAddToCollection}
        onDownloadToDevice={handleDownloadToDevice}
        isAddingToCollection={isAdding}
      />

      <TipPaymentModal
        open={showTipModal}
        onOpenChange={setShowTipModal}
        track={track}
      />
    </>
  );
}
