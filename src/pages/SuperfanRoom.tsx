import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useTracks } from "@/hooks/useTracks";
import { usePurchases } from "@/hooks/usePurchases";
import { useSuperfanMembership } from "@/hooks/useSuperfanMembership";
import { useSuperfanStatus } from "@/hooks/useSuperfanStatus";
import { useTopSupporters } from "@/hooks/useTopSupporters";
import { StatusPanel } from "@/components/superfan/StatusPanel";
import { ExclusiveDrops } from "@/components/superfan/ExclusiveDrops";
import { VIPPerks } from "@/components/superfan/VIPPerks";
import { TopSupporters } from "@/components/superfan/TopSupporters";
import { DirectMessages } from "@/components/superfan/DirectMessages";
import { CheckoutLoadingOverlay } from "@/components/subscription/CheckoutLoadingOverlay";
import { supabase } from "@/integrations/supabase/client";

export default function SuperfanRoom() {
  const { id: artistId } = useParams();
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: artist, isLoading: artistLoading } = useArtistProfile(artistId);
  const { data: membership, isLoading: membershipLoading } = useSuperfanMembership(artistId);
  const { data: subscription } = useSuperfanStatus(artistId, user?.id);
  const { data: tracks } = useTracks({ artistId, publishedOnly: true });
  const { data: supporters } = useTopSupporters(artistId);
  const { purchasedTrackIds } = usePurchases();

  const isSubscribed = !!subscription && subscription.status === "active";

  // Filter exclusive tracks (for now, show latest tracks as "exclusive" content)
  const exclusiveTracks = (tracks || []).slice(0, 6);

  const handleSubscribe = async () => {
    if (!user) {
      showFeedback({ type: "warning", title: "Sign in required", message: "Please sign in to subscribe" });
      return;
    }
    if (!membership) {
      showFeedback({ type: "error", title: "Not available", message: "Superfan membership not set up yet" });
      return;
    }

    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-superfan-checkout", {
        body: { artistId, membershipId: membership.id },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      showFeedback({ type: "error", title: "Error", message: "Failed to start checkout" });
      setIsCheckingOut(false);
    }
  };

  if (artistLoading || membershipLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Artist not found</h1>
        </div>
      </Layout>
    );
  }

  const defaultPerks = [
    "Early access to new drops",
    "Exclusive versions & remixes",
    "Direct message access",
    "VIP supporter badge",
  ];

  const perks = membership?.perks
    ? (Array.isArray(membership.perks) ? membership.perks : defaultPerks)
    : defaultPerks;

  return (
    <Layout>
      <CheckoutLoadingOverlay isVisible={isCheckingOut} message="Preparing superfan checkout..." />

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Back button */}
        <Link to={`/artist/${artistId}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to {artist.display_name || "Artist"}
          </Button>
        </Link>

        {/* Status Panel */}
        <StatusPanel
          isSubscribed={isSubscribed}
          subscription={subscription || null}
          membershipDescription={membership?.description || null}
          perks={perks as string[]}
          priceCents={membership?.monthly_price_cents || 499}
          onSubscribe={handleSubscribe}
          isCheckingOut={isCheckingOut}
          isLoggedIn={!!user}
        />

        {/* Exclusive Drops */}
        <ExclusiveDrops
          tracks={exclusiveTracks}
          isSubscribed={isSubscribed}
          artistId={artistId!}
          artistName={artist.display_name || "Artist"}
          ownedTrackIds={purchasedTrackIds}
        />

        {/* VIP Perks */}
        <VIPPerks isSubscribed={isSubscribed} perks={perks as string[]} />

        {/* Top Supporters */}
        <TopSupporters supporters={supporters || []} currentUserId={user?.id} />

        {/* Direct Messages */}
        <DirectMessages
          artistId={artistId!}
          fanId={user?.id}
          isSubscribed={isSubscribed}
          currentUserId={user?.id}
          artistName={artist.display_name || "Artist"}
        />
      </div>
    </Layout>
  );
}
