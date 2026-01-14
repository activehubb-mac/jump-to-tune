import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Music, Disc3 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type"); // "subscription" or "track"
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate relevant queries to refresh subscription/purchase data
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["owned-tracks"] });
    queryClient.invalidateQueries({ queryKey: ["collection-stats"] });
    queryClient.invalidateQueries({ queryKey: ["collection-bookmarks"] });
  }, [queryClient]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-8 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            {type === "subscription" ? "Subscription Activated!" : "Purchase Complete!"}
          </h1>

          <p className="text-muted-foreground mb-8">
            {type === "subscription"
              ? "Welcome! Your subscription is now active. Enjoy unlimited streaming and downloads."
              : "Thank you for your purchase! The track has been added to your collection."}
          </p>

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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/collection">Go to Collection</Link>
            </Button>
            <Button variant="outline" className="border-glass-border" asChild>
              <Link to="/browse">Browse More Music</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
