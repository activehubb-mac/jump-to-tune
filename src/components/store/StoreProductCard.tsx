import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Music, Package, Gift, Star, CheckCircle, Ticket, Sparkles } from "lucide-react";
import type { StoreProduct } from "@/hooks/useStoreProducts";
import { WaitlistButton } from "./WaitlistButton";
import { ScheduledReleaseBadge } from "./ScheduledReleaseBadge";

const typeIcons: Record<string, React.ReactNode> = {
  digital_track: <Music className="w-3 h-3" />,
  digital_bundle: <Gift className="w-3 h-3" />,
  merch: <Package className="w-3 h-3" />,
  superfan: <Star className="w-3 h-3" />,
  ticket: <Ticket className="w-3 h-3" />,
  limited_drop: <Sparkles className="w-3 h-3" />,
};

interface Props {
  product: StoreProduct;
  owned?: boolean;
  onBuy: (productId: string) => void;
  isCheckingOut?: boolean;
  artistName?: string;
}

export function StoreProductCard({ product, owned, onBuy, isCheckingOut, artistName }: Props) {
  const remaining = product.inventory_limit ? product.inventory_limit - product.inventory_sold : null;
  const isSoldOut = remaining !== null && remaining <= 0;
  const isScheduled = product.scheduled_release_at && new Date(product.scheduled_release_at).getTime() > Date.now();

  return (
    <div className="glass-card p-4 group hover:bg-primary/5 transition-all duration-300">
      <div className="aspect-square rounded-lg bg-muted/50 mb-3 relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {typeIcons[product.type] ? (
              <div className="w-12 h-12 flex items-center justify-center text-muted-foreground/50">
                {typeIcons[product.type]}
              </div>
            ) : (
              <Package className="w-12 h-12 text-muted-foreground/50" />
            )}
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {(product as any).is_featured && (
            <Badge className="bg-yellow-500/90 text-white text-xs">⭐ Featured</Badge>
          )}
          {isScheduled && (
            <ScheduledReleaseBadge scheduledAt={product.scheduled_release_at!} />
          )}
          {product.is_early_release && (
            <Badge className="bg-accent/90 text-accent-foreground text-xs">Early Access</Badge>
          )}
          {product.is_exclusive && (
            <Badge className="bg-primary/90 text-primary-foreground text-xs">Exclusive</Badge>
          )}
          {product.parent_product_id && (
            <Badge className="bg-secondary/90 text-secondary-foreground text-xs">V2</Badge>
          )}
          {owned && (
            <Badge className="bg-green-500/90 text-white text-xs">
              <CheckCircle className="w-3 h-3 mr-1" /> Owned
            </Badge>
          )}
        </div>
        {remaining !== null && remaining > 0 && (
          <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs">
            {remaining} left
          </Badge>
        )}
      </div>

      <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
      {product.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
      )}
      {artistName && (
        <p className="text-[10px] text-muted-foreground mt-1">Sold and fulfilled by {artistName}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="text-primary font-bold">${(product.price_cents / 100).toFixed(2)}</span>
        {owned ? (
          <Badge variant="outline" className="text-xs">Purchased</Badge>
        ) : isSoldOut ? (
          <WaitlistButton productId={product.id} compact />
        ) : isScheduled ? (
          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
        ) : (
          <Button
            size="sm"
            className="gradient-accent"
            onClick={() => onBuy(product.id)}
            disabled={isCheckingOut}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Buy
          </Button>
        )}
      </div>
    </div>
  );
}
