import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnedTracks } from "@/hooks/useCollectionStats";
import { useFanLoyalty } from "@/hooks/useFanLoyalty";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { VaultHeader } from "@/components/vault/VaultHeader";
import { DigitalCollection } from "@/components/vault/DigitalCollection";
import { LimitedEditions } from "@/components/vault/LimitedEditions";
import { LoyaltyLevelCard } from "@/components/vault/LoyaltyLevelCard";
import { VaultOrderHistory } from "@/components/vault/VaultOrderHistory";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export default function FanVault() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: ownedTracks, isLoading: ownedLoading } = useOwnedTracks(user?.id);
  const { totalPoints, highestLevel, isLoading: loyaltyLoading } = useFanLoyalty();

  // Superfan subscriptions
  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["vault-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("superfan_subscribers")
        .select("*, artist:artist_id(display_name, avatar_url)")
        .eq("fan_id", user!.id)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Store orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["vault-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders")
        .select("*, product:product_id(title, type)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return <Layout><div className="container mx-auto px-4 py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
          <Button className="gradient-accent" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const purchases = (ownedTracks || []).map((p: any) => ({
    id: p.id,
    edition_number: p.edition_number,
    price_paid: p.price_paid,
    purchased_at: p.purchased_at,
    track: p.track
      ? {
          id: p.track.id,
          title: p.track.title,
          cover_art_url: p.track.cover_art_url,
          audio_url: p.track.audio_url || "",
          total_editions: p.track.total_editions,
          artist: p.track.artist
            ? { id: p.track.artist.id, display_name: p.track.artist.display_name }
            : undefined,
        }
      : null,
  }));

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        <VaultHeader
          totalPoints={totalPoints}
          highestLevel={highestLevel}
          tracksOwned={purchases.length}
        />

        <DigitalCollection purchases={purchases} isLoading={ownedLoading} />

        <LimitedEditions purchases={purchases} />

        {/* Superfan Subscriptions */}
        {subscriptions && subscriptions.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Superfan Subscriptions</h2>
            </div>
            <div className="space-y-3">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-glass-border">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {sub.artist?.avatar_url ? (
                      <img src={sub.artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Star className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{sub.artist?.display_name || "Artist"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{sub.tier_level} tier</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <LoyaltyLevelCard points={totalPoints} level={highestLevel} />

        <VaultOrderHistory orders={orders || []} isLoading={ordersLoading} />
      </div>
    </Layout>
  );
}
