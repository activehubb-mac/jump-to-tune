import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useStoreProducts } from "@/hooks/useStoreProducts";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { createProduct } = useStoreProducts(user?.id);
  const [type, setType] = useState("digital_track");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [inventoryLimit, setInventoryLimit] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [isEarlyRelease, setIsEarlyRelease] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [isFeatured, setIsFeatured] = useState(false);
  const [shippingPriceDollars, setShippingPriceDollars] = useState("");

  const handleSubmit = () => {
    const priceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (!title || priceCents <= 0) return;

    const shippingCents = shippingPriceDollars ? Math.round(parseFloat(shippingPriceDollars) * 100) : 0;

    createProduct.mutate(
      {
        type,
        title,
        description: description || undefined,
        price_cents: priceCents,
        inventory_limit: inventoryLimit ? parseInt(inventoryLimit) : null,
        is_exclusive: isExclusive,
        is_early_release: isEarlyRelease,
        visibility,
        is_featured: isFeatured,
        shipping_price_cents: shippingCents,
      } as any,
      {
        onSuccess: () => {
          onOpenChange(false);
          setTitle("");
          setDescription("");
          setPriceDollars("");
          setInventoryLimit("");
          setIsExclusive(false);
          setIsEarlyRelease(false);
          setVisibility("public");
          setIsFeatured(false);
          setShippingPriceDollars("");
        },
      }
    );
  };

  const isDigital = type === "digital_track" || type === "digital_bundle";
  const isPhysical = type === "merch" || type === "ticket";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Product Type */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Product Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digital_track">Digital Track</SelectItem>
                <SelectItem value="digital_bundle">Digital Bundle</SelectItem>
                <SelectItem value="merch">Physical Merch</SelectItem>
                <SelectItem value="ticket">Ticket / Access Pass</SelectItem>
                <SelectItem value="limited_drop">Limited Drop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product title" />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." rows={3} />
          </div>

          {/* Price & Inventory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Price (USD)</label>
              <Input type="number" min="0.50" step="0.01" value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} placeholder="9.99" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Limited Qty (optional)</label>
              <Input type="number" min="1" value={inventoryLimit} onChange={(e) => setInventoryLimit(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>

          {/* Shipping Price (physical only) */}
          {isPhysical && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Shipping Price (USD)</label>
              <Input type="number" min="0" step="0.01" value={shippingPriceDollars} onChange={(e) => setShippingPriceDollars(e.target.value)} placeholder="0.00 (free)" />
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Visibility</label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="superfan_only">Superfan Only</SelectItem>
                <SelectItem value="store_purchase_required">Store Purchase Required</SelectItem>
                <SelectItem value="limited_time">Limited Time (90 days)</SelectItem>
                <SelectItem value="permanent_exclusive">Permanent Exclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {isDigital && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={isExclusive} onCheckedChange={setIsExclusive} />
                  <span className="text-sm text-foreground">Superfan Exclusive</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isEarlyRelease} onCheckedChange={setIsEarlyRelease} />
                  <span className="text-sm text-foreground">Early Release</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              <span className="text-sm text-foreground">Featured Item</span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!title || !priceDollars || createProduct.isPending} className="w-full gradient-accent">
            {createProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
