import { Loader2, Store, Star } from "lucide-react";
import { useStoreProducts } from "@/hooks/useStoreProducts";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";
import { StoreProductCard } from "./StoreProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  artistId: string;
  artistName: string;
}

export function ArtistStoreTab({ artistId, artistName }: Props) {
  const { products, isLoading } = useStoreProducts(artistId);
  const { checkout, isLoading: isCheckingOut } = useStoreCheckout();
  const { user } = useAuth();

  // Check which products buyer owns
  const { data: ownedProductIds } = useQuery({
    queryKey: ["owned-store-products", artistId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders")
        .select("product_id")
        .eq("buyer_id", user!.id)
        .in("status", ["completed", "fulfilled", "shipped"]);
      if (error) throw error;
      return new Set(data.map((o) => o.product_id));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const activeProducts = products.filter((p) => p.is_active);
  const digitalTracks = activeProducts.filter((p) => p.type === "digital_track" || p.type === "digital_bundle");
  const limitedEditions = activeProducts.filter((p) => p.inventory_limit && p.inventory_limit > 0);
  const merch = activeProducts.filter((p) => p.type === "merch");

  if (activeProducts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No products available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Support Header */}
      <div className="glass-card p-6 text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">Support {artistName} Directly</h3>
        <p className="text-sm text-muted-foreground">Every purchase goes directly to the artist. Browse exclusive drops, merch, and more.</p>
      </div>

      {/* Digital Drops */}
      {digitalTracks.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">Digital Drops</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {digitalTracks.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                owned={ownedProductIds?.has(product.id)}
                onBuy={checkout}
                isCheckingOut={isCheckingOut}
              />
            ))}
          </div>
        </section>
      )}

      {/* Limited Editions */}
      {limitedEditions.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">Limited Editions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {limitedEditions.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                owned={ownedProductIds?.has(product.id)}
                onBuy={checkout}
                isCheckingOut={isCheckingOut}
              />
            ))}
          </div>
        </section>
      )}

      {/* Merch */}
      {merch.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">Merch</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {merch.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                owned={ownedProductIds?.has(product.id)}
                onBuy={checkout}
                isCheckingOut={isCheckingOut}
              />
            ))}
          </div>
        </section>
      )}

      {/* Superfan Banner */}
      <div className="glass-card-bordered p-6 text-center">
        <Star className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">Become a Superfan</h3>
        <p className="text-sm text-muted-foreground mb-4">Get exclusive content, early access, and direct messaging.</p>
        <Button variant="outline" className="border-primary/50 text-primary" asChild>
          <Link to={`/artist/${artistId}/superfan`}>Explore Superfan Room</Link>
        </Button>
      </div>
    </div>
  );
}
