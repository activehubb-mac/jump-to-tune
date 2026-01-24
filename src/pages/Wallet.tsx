import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Plus, ArrowLeft, RefreshCw, CreditCard, Info, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { QuickTopupModal } from "@/components/wallet/QuickTopupModal";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { useLowBalanceNotification } from "@/hooks/useLowBalanceNotification";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";

const PRESET_AMOUNTS = [
  { cents: 500, label: "$5", credits: "$4.95" },
  { cents: 1000, label: "$10", credits: "$9.90" },
  { cents: 2500, label: "$25", credits: "$24.75" },
  { cents: 5000, label: "$50", credits: "$49.50" },
  { cents: 10000, label: "$100", credits: "$99.00" },
];

export default function WalletPage() {
  const { user } = useAuth();
  const { balance, balanceDollars, transactions, isLoading, refetch, purchaseCredits, isPurchasing } = useWallet();
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Check for low balance and show notification if needed
  useLowBalanceNotification();

  const handleQuickPurchase = async (cents: number) => {
    setSelectedPreset(cents);
    await purchaseCredits(cents);
    setSelectedPreset(null);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access your wallet</h1>
          <p className="text-muted-foreground mb-6">
            Your credit wallet allows you to make instant purchases
          </p>
          <Button asChild className="gradient-accent">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <Layout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/library">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Credit Wallet</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your credits for instant purchases
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8" style={{ contain: 'layout' }}>
          {/* Balance Card */}
          <div className="lg:col-span-1 space-y-6 min-h-[280px]">
            <Card className="glass overflow-hidden min-h-[200px]">
              <div className="gradient-accent p-6">
                <div className="flex items-center justify-between mb-4">
                  <Wallet className="h-8 w-8 text-foreground" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetch()}
                    className="text-foreground/80 hover:text-foreground"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>
                <p className="text-sm text-foreground/80 mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-foreground">
                  ${balanceDollars.toFixed(2)}
                </p>
              </div>
              <CardContent className="p-4">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowTopupModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="glass">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">How Credits Work</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Credits enable instant purchases without checkout delays. 
                      A 1% processing fee applies when buying credits.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Minimum Purchase</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      The minimum credit purchase is $5.00. Credits never expire.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 min-h-[400px]">
            {/* Quick Add */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Quick Add Credits</CardTitle>
                <CardDescription>
                  Choose a preset amount to add to your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount.cents}
                      variant="outline"
                      className="flex flex-col h-auto py-4 border-glass-border hover:border-primary hover:bg-primary/10"
                      onClick={() => handleQuickPurchase(amount.cents)}
                      disabled={isPurchasing}
                    >
                      {selectedPreset === amount.cents && isPurchasing ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span className="text-lg font-bold">{amount.label}</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {amount.credits} credits
                          </span>
                        </>
                      )}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Or <button 
                    onClick={() => setShowTopupModal(true)} 
                    className="text-primary hover:underline"
                  >
                    enter a custom amount
                  </button>
                </p>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    Your recent credit activity
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionHistory transactions={transactions} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </PullToRefresh>

      <QuickTopupModal open={showTopupModal} onOpenChange={setShowTopupModal} />
    </Layout>
  );
}
