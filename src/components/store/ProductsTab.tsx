import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Package, Music, Gift, Star, Eye, EyeOff, Copy } from "lucide-react";
import { useStoreProducts, type StoreProduct } from "@/hooks/useStoreProducts";
import { useAuth } from "@/contexts/AuthContext";
import { AddProductModal } from "./AddProductModal";
import { CreateVersionModal } from "./CreateVersionModal";
import { useWaitlist } from "@/hooks/useWaitlist";

const typeIcons: Record<string, React.ReactNode> = {
  digital_track: <Music className="w-4 h-4" />,
  digital_bundle: <Gift className="w-4 h-4" />,
  merch: <Package className="w-4 h-4" />,
  superfan: <Star className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  digital_track: "Digital Track",
  digital_bundle: "Digital Bundle",
  merch: "Merch",
  superfan: "Superfan",
  limited_drop: "Limited Drop",
  ticket: "Ticket",
};

function WaitlistCount({ productId }: { productId: string }) {
  const { waitlistCount } = useWaitlist(productId);
  if (waitlistCount === 0) return null;
  return <span className="text-xs text-muted-foreground">🔔 {waitlistCount} waiting</span>;
}

export function ProductsTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [versionParent, setVersionParent] = useState<StoreProduct | null>(null);
  const { products, isLoading, toggleActive } = useStoreProducts(user?.id, filter);

  const isSoldOut = (p: StoreProduct) =>
    p.inventory_limit !== null && p.inventory_sold >= p.inventory_limit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="digital_track">Digital Tracks</SelectItem>
            <SelectItem value="digital_bundle">Bundles</SelectItem>
            <SelectItem value="merch">Merch</SelectItem>
            <SelectItem value="limited_drop">Limited Drops</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAdd(true)} className="gradient-accent">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No products yet. Add your first product to start selling.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  typeIcons[product.type] || <Package className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-foreground truncate">{product.title}</h4>
                  <Badge variant="outline" className="text-xs shrink-0">{typeLabels[product.type] || product.type}</Badge>
                  {product.is_exclusive && <Badge className="bg-primary/20 text-primary text-xs shrink-0">Exclusive</Badge>}
                  {isSoldOut(product) && <Badge className="bg-destructive/20 text-destructive text-xs shrink-0">Sold Out</Badge>}
                  {product.parent_product_id && <Badge className="bg-secondary/20 text-secondary-foreground text-xs shrink-0">V2</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="text-primary font-medium">${(product.price_cents / 100).toFixed(2)}</span>
                  {product.inventory_limit && (
                    <span>{product.inventory_sold}/{product.inventory_limit} sold</span>
                  )}
                  {product.max_per_account && (
                    <span>Max {product.max_per_account}/fan</span>
                  )}
                  {isSoldOut(product) && <WaitlistCount productId={product.id} />}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isSoldOut(product) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVersionParent(product)}
                    title="Create new version"
                  >
                    <Copy className="w-4 h-4 text-primary" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleActive.mutate({ id: product.id, is_active: !product.is_active })}
                  title={product.is_active ? "Deactivate" : "Activate"}
                >
                  {product.is_active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddProductModal open={showAdd} onOpenChange={setShowAdd} />
      {versionParent && (
        <CreateVersionModal
          open={!!versionParent}
          onOpenChange={(open) => !open && setVersionParent(null)}
          parentProduct={versionParent}
        />
      )}
    </div>
  );
}
