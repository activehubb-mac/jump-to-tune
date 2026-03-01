import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Mail, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { getMobileHeaders, openPaymentUrl } from "@/lib/platformBrowser";
import type { StoreProduct } from "@/hooks/useStoreProducts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: StoreProduct | null;
}

export function GuestCheckoutModal({ open, onOpenChange, product }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showFeedback } = useFeedbackSafe();

  const isMerch = product?.type === "merch" || product?.type === "physical_merch";

  const handleCheckout = async () => {
    if (!email || !product) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-store-checkout", {
        headers: { ...getMobileHeaders() },
        body: {
          productId: product.id,
          quantity: 1,
          buyerEmail: email,
          buyerName: name || undefined,
        },
      });

      if (error) throw error;
      if (data?.url) {
        await openPaymentUrl(data.url);
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "No checkout URL received");
      }
    } catch (err) {
      showFeedback({
        type: "error",
        title: "Checkout Failed",
        message: err instanceof Error ? err.message : "Failed to start checkout",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded-md object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted/50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{product.title}</p>
              <p className="text-primary font-bold">${(product.price_cents / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Name (optional)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="pl-10"
              />
            </div>
          </div>

          {isMerch && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Shipping address will be collected on the payment page.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            No account needed. Want to track purchases? Create an account after checkout.
          </p>

          <Button
            onClick={handleCheckout}
            disabled={!email || isLoading}
            className="w-full gradient-accent"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
            Pay & Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
