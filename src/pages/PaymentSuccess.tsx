import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Music, Disc3, Crown, ArrowUp, Download, Loader2, Wallet, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useDownload } from "@/hooks/useDownload";
import { useFeedback } from "@/contexts/FeedbackContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type"); // "subscription", "purchase", or "credits"
  const trackId = searchParams.get("track_id");
  const credits = searchParams.get("credits");
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { downloadOwnedTrack, isDownloading } = useDownload();
  const { showFeedback } = useFeedback();
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const hasShownFeedback = useRef(false);

  useEffect(() => {
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["owned-tracks"] });
    queryClient.invalidateQueries({ queryKey: ["collection-stats"] });
    queryClient.invalidateQueries({ queryKey: ["collection-bookmarks"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });

    // Show feedback modal only once
    if (!hasShownFeedback.current) {
      hasShownFeedback.current = true;

      if (type === "subscription") {
        refreshProfile().then(() => {
          showFeedback({
            type: "success",
            title: "Subscription Activated!",
            message: "Welcome! Your subscription is now active. Enjoy unlimited streaming and downloads.",
            autoClose: true,
            autoCloseDelay: 5000,
          });
        });
      } else if (type === "credits" && credits) {
        showFeedback({
          type: "success",
          title: "Credits Added!",
          message: `$${(parseInt(credits) / 100).toFixed(2)} credits have been successfully added to your wallet.`,
          primaryAction: {
            label: "View Wallet",
            onClick: () => window.location.href = "/wallet",
          },
          autoClose: true,
          autoCloseDelay: 6000,
        });
      } else if (type === "purchase") {
        showFeedback({
          type: "success",
          title: "Purchase Complete!",
          message: "Thank you for your purchase! The track has been added to your collection.",
          autoClose: true,
          autoCloseDelay: 5000,
        });
      }
    }
  }, [queryClient, type, refreshProfile, credits, showFeedback]);

  const handleDownload = async () => {
    if (trackId) {
      await downloadOwnedTrack(trackId);
      setHasDownloaded(true);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "subscription":
        return "Subscription Activated!";
      case "purchase":
        return "Purchase Complete!";
      case "credits":
        return "Credits Added!";
      default:
        return "Payment Successful!";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "subscription":
        return "Welcome! Your subscription is now active. Enjoy unlimited streaming and downloads.";
      case "purchase":
        return "Thank you for your purchase! The track has been added to your collection.";
      case "credits":
        return credits 
          ? `$${(parseInt(credits) / 100).toFixed(2)} credits have been added to your wallet.`
          : "Credits have been added to your wallet.";
      default:
        return "Your payment was processed successfully.";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto text-center">
          {/* Success Icon - Different for credits */}
          {type === "credits" ? (
            <div className="w-24 h-24 mx-auto rounded-full gradient-accent flex items-center justify-center mb-8 animate-pulse neon-glow-subtle">
              <Wallet className="w-12 h-12 text-foreground" />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-8 animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          )}

          <h1 className="text-3xl font-bold text-foreground mb-4">
            {getTitle()}
          </h1>

          <p className="text-muted-foreground mb-4">
            {getDescription()}
          </p>

          {/* Credit Amount Badge for credit purchases */}
          {type === "credits" && credits && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-foreground">
                +${(parseInt(credits) / 100).toFixed(2)} credits
              </span>
            </div>
          )}

          {type !== "credits" && <div className="mb-8" />}

          {/* What's Next */}
          <div className="glass-card p-6 mb-8 text-left">
            <h2 className="font-semibold text-foreground mb-4">What's next?</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {type === "subscription" ? (
                <>
                  <li className="flex items-start gap-2">
                    <Music className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Stream any track in our catalog without limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Disc3 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Download tracks for offline listening</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Crown className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Access all premium features based on your plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Your role and permissions have been updated</span>
                  </li>
                </>
              ) : type === "credits" ? (
                <>
                  <li className="flex items-start gap-2">
                    <Wallet className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Credits are ready to use for instant purchases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Music className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Buy tracks with one click - no checkout delays</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Disc3 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Credits never expire</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <Music className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Your track is now in your collection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Disc3 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Download it anytime for offline listening</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Download Button for Track Purchases */}
          {type === "purchase" && trackId && (
            <div className="mb-6">
              <Button
                className="w-full gradient-accent neon-glow-subtle"
                onClick={handleDownload}
                disabled={isDownloading || hasDownloaded}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : hasDownloaded ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Now
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {type === "credits" ? (
              <>
                <Button className="gradient-accent neon-glow-subtle" asChild>
                  <Link to="/wallet">
                    <Wallet className="h-4 w-4 mr-2" />
                    View Wallet
                  </Link>
                </Button>
                <Button variant="outline" className="border-glass-border" asChild>
                  <Link to="/browse">Browse Music</Link>
                </Button>
              </>
            ) : (
              <>
                <Button className="gradient-accent neon-glow-subtle" asChild>
                  <Link to="/collection">Go to Collection</Link>
                </Button>
                <Button variant="outline" className="border-glass-border" asChild>
                  <Link to="/browse">Browse More Music</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
