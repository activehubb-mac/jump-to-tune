import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";
import { useStoreProducts } from "@/hooks/useStoreProducts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { createProduct } = useStoreProducts(user?.id);
  const { showFeedback } = useFeedbackSafe();
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
  const [maxPerAccount, setMaxPerAccount] = useState("");
  const [scheduledRelease, setScheduledRelease] = useState("");
  const [checkoutType, setCheckoutType] = useState("guest_allowed");
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File, subfolder: string): Promise<string> => {
    const filePath = `${user!.id}/${subfolder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("store-files").upload(filePath, file);
    if (error) throw error;
    // Return the storage path (will be resolved to signed URL at download time)
    const { data } = supabase.storage.from("store-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    const priceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (!title || priceCents <= 0) return;

    setIsUploading(true);
    try {
      let digitalFileUrl: string | null = null;
      let licensePdfUrl: string | null = null;

      if (digitalFile) {
        digitalFileUrl = await uploadFile(digitalFile, "digital");
      }
      if (licenseFile) {
        licensePdfUrl = await uploadFile(licenseFile, "licenses");
      }

      const shippingCents = shippingPriceDollars ? Math.round(parseFloat(shippingPriceDollars) * 100) : 0;

      // Force account_required for subscription type
      const effectiveCheckoutType = type === "subscription" ? "account_required" : checkoutType;

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
          max_per_account: maxPerAccount ? parseInt(maxPerAccount) : null,
          scheduled_release_at: scheduledRelease || null,
          checkout_type: effectiveCheckoutType,
          digital_file_url: digitalFileUrl,
          license_pdf_url: licensePdfUrl,
        } as any,
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        }
      );
    } catch (err) {
      showFeedback({
        type: "error",
        title: "Upload Failed",
        message: err instanceof Error ? err.message : "Failed to upload files",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriceDollars("");
    setInventoryLimit("");
    setIsExclusive(false);
    setIsEarlyRelease(false);
    setVisibility("public");
    setIsFeatured(false);
    setShippingPriceDollars("");
    setMaxPerAccount("");
    setScheduledRelease("");
    setCheckoutType("guest_allowed");
    setDigitalFile(null);
    setLicenseFile(null);
  };

  const isDigital = ["digital_track", "digital_bundle", "beat", "digital_product"].includes(type);
  const isPhysical = type === "merch" || type === "physical_merch" || type === "ticket";
  const isBeat = type === "beat";

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
            <Select value={type} onValueChange={(v) => { setType(v); if (v === "subscription") setCheckoutType("account_required"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digital_track">Digital Track</SelectItem>
                <SelectItem value="beat">Beat</SelectItem>
                <SelectItem value="digital_product">Digital Product (Kit, Loop Pack, etc.)</SelectItem>
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

          {/* Checkout Type */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Checkout Type</label>
            <Select value={checkoutType} onValueChange={setCheckoutType} disabled={type === "subscription"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="guest_allowed">Guest Allowed (no account needed)</SelectItem>
                <SelectItem value="account_required">Account Required</SelectItem>
              </SelectContent>
            </Select>
            {type === "subscription" && (
              <p className="text-xs text-muted-foreground mt-1">Subscriptions always require an account.</p>
            )}
          </div>

          {/* Digital File Upload */}
          {isDigital && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isBeat ? "Beat File" : "Digital File"} (audio, zip, etc.)
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {digitalFile ? digitalFile.name : "Choose file..."}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          {/* License PDF (beats only) */}
          {isBeat && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">License PDF (optional)</label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {licenseFile ? licenseFile.name : "Choose license PDF..."}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          {/* Max Per Account & Scheduled Release */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Max Per Fan (optional)</label>
              <Input type="number" min="1" value={maxPerAccount} onChange={(e) => setMaxPerAccount(e.target.value)} placeholder="No limit" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Scheduled Release</label>
              <Input type="datetime-local" value={scheduledRelease} onChange={(e) => setScheduledRelease(e.target.value)} />
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

          <Button
            onClick={handleSubmit}
            disabled={!title || !priceDollars || createProduct.isPending || isUploading}
            className="w-full gradient-accent"
          >
            {(createProduct.isPending || isUploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
