import { Link } from "react-router-dom";
import { DollarSign, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeConnect } from "@/hooks/useStripeConnect";

export function EarningsWidget() {
  const {
    isConnected,
    accountStatus,
    payoutsEnabled,
    pendingEarningsDollars,
    paidEarningsDollars,
    totalEarningsDollars,
    isLoading,
    startOnboarding,
    isConnecting,
  } = useStripeConnect();

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Earnings</h3>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Not connected to Stripe
  if (!isConnected) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Earnings</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Set up Stripe to receive payouts from your sales.
        </p>
        <Button
          onClick={startOnboarding}
          disabled={isConnecting}
          className="w-full gradient-accent"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          Connect Stripe
        </Button>
      </div>
    );
  }

  // Connected but onboarding pending
  if (accountStatus === "pending" || !payoutsEnabled) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Earnings</h3>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-400">
            Complete Stripe setup to enable payouts.
          </p>
        </div>
        <Button
          onClick={startOnboarding}
          disabled={isConnecting}
          variant="outline"
          className="w-full"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          Complete Setup
        </Button>
      </div>
    );
  }

  // Fully connected - show earnings
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Earnings</h3>
        </div>
        <Link
          to="/artist/payouts"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {/* Pending Payouts - Highlighted */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending Payout</span>
            <span className="text-xl font-bold text-primary">
              ${pendingEarningsDollars.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Other stats */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Paid</span>
          <span className="text-foreground">${paidEarningsDollars.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">All Time</span>
          <span className="text-foreground font-medium">${totalEarningsDollars.toFixed(2)}</span>
        </div>
      </div>

      <Button variant="outline" className="w-full mt-4" asChild>
        <Link to="/artist/payouts">
          <DollarSign className="w-4 h-4 mr-2" />
          Manage Payouts
        </Link>
      </Button>
    </div>
  );
}
