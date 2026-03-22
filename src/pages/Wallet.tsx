import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowLeft, RefreshCw, CreditCard, Info, History, Sparkles } from "lucide-react";
import { AutoReloadPanel } from "@/components/wallet/AutoReloadPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useAICredits } from "@/hooks/useAICredits";
import { useWallet } from "@/hooks/useWallet";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { AI_TOOL_PRICING } from "@/lib/aiPricing";
import { openExternalUrl, getMobileHeaders } from "@/lib/platformBrowser";

const AI_CREDIT_PACKS = [
  { credits: 100, price: 1000, label: "100 credits", priceLabel: "$10", productId: "prod_U64QH9DtMPUYNi" },
  { credits: 500, price: 4000, label: "500 credits", priceLabel: "$40", popular: true, productId: "prod_U64Scf2yEj3f3R" },
  { credits: 2000, price: 9800, label: "2,000 credits", priceLabel: "$98", best: true, productId: "prod_U64VwSdypd7g5x" },
];

const STARTER_PACK = {
  credits: 500, price: 4900, label: "AI Artist Starter Pack", priceLabel: "$49", productId: "prod_U64XcXRpHSD7Qz",
  includes: ["500 AI credits", "Full AI Release Builder workflow", "AI cover art + avatar + video"],
};

export default function WalletPage() {
  const { user } = useAuth();
  const { aiCredits, isLoading: creditsLoading, refetch: refetchCredits } = useAICredits();
  const { transactions, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { showFeedback } = useFeedbackSafe();
  const [purchasingPack, setPurchasingPack] = useState<number | null>(null);

  const handlePurchasePack = useCallback(async (pack: { credits: number; price: number; label: string; priceLabel: string; productId?: string }) => {
    setPurchasingPack(pack.credits);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        showFeedback({ type: "error", title: "Auth Required", message: "Please sign in." });
        return;
      }
      const body = pack.productId
        ? { product_id: pack.productId }
        : { amount_cents: pack.price };
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body,
        headers: { Authorization: `Bearer ${session.session.access_token}`, ...getMobileHeaders() },
      });
      if (error) {
        let msg = "Purchase failed.";
        try { if (error.context?.body) { const body = JSON.parse(error.context.body); if (body.error) msg = body.error; } } catch {}
        showFeedback({ type: "error", title: "Error", message: msg });
        return;
      }
      if (data?.url) await openExternalUrl(data.url);
    } catch (err) {
      showFeedback({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed" });
    } finally {
      setPurchasingPack(null);
    }
  }, [showFeedback]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchCredits(), refetchWallet()]);
  }, [refetchCredits, refetchWallet]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access your credits</h1>
          <p className="text-muted-foreground mb-6">AI credits power all AI tools on JumTunes</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden box-border">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link to="/library"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Credits</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Credits power all AI tools on JumTunes</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full" style={{ contain: 'layout' }}>
            {/* Balance Card */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6 w-full min-w-0">
              <Card className="glass overflow-hidden">
                <div className="bg-primary p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Zap className="h-8 w-8 text-foreground" />
                    <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-foreground/80 hover:text-foreground">
                      <RefreshCw className={cn("h-4 w-4", creditsLoading && "animate-spin")} />
                    </Button>
                  </div>
                  <p className="text-sm text-foreground/80 mb-1">Available Credits</p>
                  <p className="text-4xl font-bold text-foreground">{creditsLoading ? "..." : aiCredits.toLocaleString()}</p>
                  <p className="text-xs text-foreground/60 mt-1">AI credits</p>
                </div>
                <CardContent className="p-4">
                  <Button className="w-full gradient-accent neon-glow-subtle" asChild>
                    <Link to="/ai-release"><Sparkles className="h-4 w-4 mr-2" />AI Release Builder</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" />AI Tool Costs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(AI_TOOL_PRICING).slice(0, 7).map(([key, tool]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{tool.label}</span>
                      <span className="font-medium text-foreground">{tool.base} credits</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0">
              <Card className="glass w-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Buy AI Credit Packs</CardTitle>
                  <CardDescription>Purchase credit packs to power your AI tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
                    {AI_CREDIT_PACKS.map((pack) => (
                      <button
                        key={pack.credits}
                        onClick={() => handlePurchasePack(pack)}
                        disabled={purchasingPack !== null}
                        className={cn(
                          "relative flex flex-col items-center p-4 rounded-lg border transition-all text-center",
                          "border-glass-border hover:border-primary hover:bg-primary/5",
                          pack.popular && "border-primary/50 bg-primary/5",
                          pack.best && "border-primary bg-primary/10 ring-1 ring-primary/30"
                        )}
                      >
                        {pack.popular && <Badge className="absolute -top-2 text-[10px] bg-primary text-primary-foreground">Popular</Badge>}
                        {pack.best && <Badge className="absolute -top-2 text-[10px] bg-primary text-primary-foreground">Best Value</Badge>}
                        {purchasingPack === pack.credits ? (
                          <RefreshCw className="h-5 w-5 animate-spin text-primary my-4" />
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-foreground">{pack.priceLabel}</span>
                            <span className="text-sm text-muted-foreground mt-1">{pack.label}</span>
                            <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                              {Math.round(pack.price / pack.credits)}¢/credit
                            </span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePurchasePack(STARTER_PACK)}
                    disabled={purchasingPack !== null}
                    className="w-full p-4 rounded-lg border border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-bold text-foreground">{STARTER_PACK.label} — {STARTER_PACK.priceLabel}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {STARTER_PACK.includes.map((item) => (
                            <span key={item} className="text-xs text-muted-foreground">✓ {item}</span>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-primary/50 text-primary shrink-0">Save 51%</Badge>
                    </div>
                  </button>
                </CardContent>
              </Card>

              <Card className="glass w-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" />Transaction History</CardTitle>
                  <CardDescription>Your recent credit activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionHistory transactions={transactions} isLoading={walletLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
