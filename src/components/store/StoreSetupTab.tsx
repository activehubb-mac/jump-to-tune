import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, AlertCircle, Clock, Store } from "lucide-react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { useArtistStore } from "@/hooks/useArtistStore";

export function StoreSetupTab() {
  const { isConnected, accountStatus, payoutsEnabled, startOnboarding, isConnecting } = useStripeConnect();
  const { store, isActive, activateStore, deactivateStore } = useArtistStore();
  const [agreementChecked, setAgreementChecked] = useState(store?.seller_agreement_accepted ?? false);

  const stripeReady = isConnected && payoutsEnabled && accountStatus === "active";

  const handleToggleStore = () => {
    if (isActive) {
      deactivateStore.mutate();
    } else if (agreementChecked && stripeReady) {
      activateStore.mutate(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Stripe Connect
        </h3>
        <div className="flex items-center gap-3 mb-4">
          {accountStatus === "active" ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" /> Active
            </Badge>
          ) : accountStatus === "pending" ? (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Clock className="w-3 h-3 mr-1" /> Pending
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <AlertCircle className="w-3 h-3 mr-1" /> Not Connected
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Stripe account to receive payments directly. JumTunes takes a 15% platform fee — you keep 85%.
        </p>
        {!stripeReady && (
          <Button onClick={() => startOnboarding()} disabled={isConnecting}>
            {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isConnected ? "Complete Setup" : "Connect Stripe"}
          </Button>
        )}
      </div>

      {/* Seller Agreement */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Seller Agreement</h3>
        <div className="space-y-3 text-sm text-muted-foreground mb-4">
          <p>By activating your store, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You are the merchant of record for all sales</li>
            <li>You are responsible for order fulfillment and shipping (merch)</li>
            <li>You handle all customer disputes through Stripe</li>
            <li>You are responsible for applicable taxes</li>
            <li>JumTunes collects a 15% platform fee on all sales</li>
          </ul>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={agreementChecked}
            onCheckedChange={(v) => setAgreementChecked(!!v)}
            disabled={!stripeReady}
          />
          <span className="text-sm text-foreground">
            I accept the Seller Responsibility terms
          </span>
        </label>
      </div>

      {/* Activate Store */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Activate My Store</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isActive ? "Your store is visible to fans." : "Enable your public storefront."}
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleStore}
            disabled={!stripeReady || (!isActive && !agreementChecked) || activateStore.isPending || deactivateStore.isPending}
          />
        </div>
        {!stripeReady && (
          <p className="text-xs text-destructive mt-2">Connect Stripe first to activate your store.</p>
        )}
      </div>
    </div>
  );
}
