import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  RefreshCw,
  Loader2,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { format } from "date-fns";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { cn } from "@/lib/utils";

export default function ArtistPayouts() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const { showFeedback } = useFeedbackSafe();
  const {
    isConnected,
    accountStatus,
    payoutsEnabled,
    pendingEarningsDollars,
    paidEarningsDollars,
    totalEarningsDollars,
    recentEarnings,
    isLoading,
    refetch,
    startOnboarding,
    isConnecting,
  } = useStripeConnect();

  // Handle return from Stripe onboarding
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      showFeedback({ type: "success", title: "Setup Complete", message: "Stripe account setup complete!" });
      refetch();
    } else if (searchParams.get("refresh") === "true") {
      showFeedback({ type: "info", title: "Continue Setup", message: "Please complete your Stripe onboarding" });
      refetch();
    }
  }, [searchParams, refetch, showFeedback]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access payouts</h1>
          <Button asChild className="gradient-accent">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (role !== "artist" && role !== "label") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-2">Artist or Label Account Required</h1>
          <p className="text-muted-foreground mb-6">
            Upgrade your account to access earnings and payouts.
          </p>
          <Button asChild className="gradient-accent">
            <Link to="/subscription">Upgrade Account</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = () => {
    switch (accountStatus) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pending Setup</Badge>;
      case "restricted":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Restricted</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/artist/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Payouts & Earnings</h1>
            <p className="text-muted-foreground">
              Manage your earnings and payout settings
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Withdrawal Setup Banner */}
        {!isConnected && (
          <Card className="glass border-primary/30 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Set Up Withdrawals</h3>
                    <p className="text-muted-foreground text-sm">
                      Connect your bank account to receive your earnings directly when fans purchase your tracks. 
                      Powered by Stripe.
                    </p>
                  </div>
                </div>
                <Button
                  className="gradient-accent neon-glow-subtle"
                  onClick={startOnboarding}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Withdrawal Details
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Onboarding Banner */}
        {isConnected && accountStatus === "pending" && (
          <Card className="glass border-amber-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Complete Withdrawal Setup</h3>
                    <p className="text-muted-foreground text-sm">
                      Your withdrawal account setup is pending. Complete it to start receiving your earnings.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-500/50"
                  onClick={startOnboarding}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue Setup
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Earnings Overview */}
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Earnings Overview</CardTitle>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-500/80 mb-1">Pending Payout</p>
                  <p className="text-3xl font-bold text-green-500">
                    ${pendingEarningsDollars.toFixed(2)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                    <p className="text-lg font-semibold">${totalEarningsDollars.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Paid Out</p>
                    <p className="text-lg font-semibold">${paidEarningsDollars.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Info */}
            <Card className="glass">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Revenue Split</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You receive 85% of every sale. Platform takes 15%.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Automatic Payouts</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earnings are sent directly to your connected bank account automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Earnings */}
          <div className="lg:col-span-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Recent Earnings</CardTitle>
                <CardDescription>
                  Your latest sales and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/3 bg-muted rounded" />
                          <div className="h-3 w-1/4 bg-muted rounded" />
                        </div>
                        <div className="h-4 w-16 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : recentEarnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No earnings yet</p>
                    <p className="text-sm mt-1">Sales revenue will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentEarnings.map((earning) => (
                      <div
                        key={earning.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          earning.status === "paid" ? "bg-green-500/20" : "bg-amber-500/20"
                        )}>
                          {earning.status === "paid" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Track Sale</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(earning.created_at), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-500">
                            +${(earning.artist_payout_cents / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of ${(earning.gross_amount_cents / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
