import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Package, Music, Gift, Star, Eye, EyeOff } from "lucide-react";
import { useStoreProducts } from "@/hooks/useStoreProducts";
import { useAuth } from "@/contexts/AuthContext";
import { AddProductModal } from "./AddProductModal";

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
};

export function ProductsTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const { products, isLoading, toggleActive } = useStoreProducts(user?.id, filter);

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
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground truncate">{product.title}</h4>
                  <Badge variant="outline" className="text-xs shrink-0">{typeLabels[product.type] || product.type}</Badge>
                  {product.is_exclusive && <Badge className="bg-primary/20 text-primary text-xs shrink-0">Exclusive</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="text-primary font-medium">${(product.price_cents / 100).toFixed(2)}</span>
                  {product.inventory_limit && (
                    <span>{product.inventory_sold}/{product.inventory_limit} sold</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive.mutate({ id: product.id, is_active: !product.is_active })}
                title={product.is_active ? "Deactivate" : "Activate"}
              >
                {product.is_active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddProductModal open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
