import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Copy } from "lucide-react";
import { useStoreProducts, type StoreProduct } from "@/hooks/useStoreProducts";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentProduct: StoreProduct;
}

export function CreateVersionModal({ open, onOpenChange, parentProduct }: Props) {
  const { user } = useAuth();
  const { createProduct } = useStoreProducts(user?.id);
  const [title, setTitle] = useState(`${parentProduct.title} V2`);
  const [description, setDescription] = useState(parentProduct.description || "");
  const [priceDollars, setPriceDollars] = useState((parentProduct.price_cents / 100).toFixed(2));
  const [inventoryLimit, setInventoryLimit] = useState(parentProduct.inventory_limit?.toString() || "");

  const handleCreate = () => {
    const priceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (!title || priceCents <= 0) return;

    createProduct.mutate(
      {
        type: parentProduct.type,
        title,
        description: description || undefined,
        price_cents: priceCents,
        inventory_limit: inventoryLimit ? parseInt(inventoryLimit) : null,
        is_exclusive: parentProduct.is_exclusive,
        is_early_release: parentProduct.is_early_release,
        parent_product_id: parentProduct.id,
      } as any,
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" /> Create New Version
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This creates a new drop linked to the original "{parentProduct.title}" with separate supply and analytics.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Price (USD)</label>
              <Input type="number" min="0.50" step="0.01" value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Supply</label>
              <Input type="number" min="1" value={inventoryLimit} onChange={(e) => setInventoryLimit(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!title || !priceDollars || createProduct.isPending} className="w-full gradient-accent">
            {createProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Version
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
