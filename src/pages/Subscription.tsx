import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Crown,
  Loader2,
  Check,
  Sparkles,
  ExternalLink,
  Calendar,
  CreditCard,
  ArrowRight,
  Lock,
  AlertTriangle,
  Music,
  Users,
  XCircle,
  Pause,
  Play,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useDownload } from "@/hooks/useDownload";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { CheckoutLoadingOverlay } from "@/components/subscription/CheckoutLoadingOverlay";
import { openPaymentUrl, openExternalUrl, isNativeApp } from "@/lib/platformBrowser";

const SUBSCRIPTION_TIERS = [
  {
    tier: "fan" as const,
    name: "Creator",
    price: "$10",
    priceValue: 10,
    features: ["300 AI credits / month", "Upload unlimited tracks", "AI cover art generator", "AI release builder", "Artist dashboard & analytics"],
    description: "Start releasing AI music",
  },
  {
    tier: "artist" as const,
    name: "Creator Pro",
    price: "$25",
    priceValue: 25,
    features: ["800 AI credits / month", "All Creator features", "AI video generator", "AI avatar generator", "AI playlist generator", "Priority AI processing"],
    description: "For serious AI creators",
  },
  {
    tier: "label" as const,
    name: "Label / Studio",
    price: "$79",
    priceValue: 79,
    features: ["2,000 AI credits / month", "All Pro features", "All AI features unlocked", "Multi-artist management (up to 10)", "Label dashboard & roster management"],
    description: "For studios & labels",
  },
];

const PAUSE_DURATION_OPTIONS = [
  { value: "1", label: "1 month" },
  { value: "2", label: "2 months" },
  { value: "3", label: "3 months" },
];

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  warning?: string;
  trackCount?: number;
  rosterCount?: number;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
  prorationInfo?: {
    isUpgrade?: boolean;
    isDowngrade?: boolean;
    message: string;
  };
}

export default function Subscription() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, hasActiveSubscription, isInTrial, daysLeftInTrial, isPaused, pausedUntil, refreshSubscription } = useSubscription();
  const { createSubscriptionCheckout, openCustomerPortal } = useDownload();
  const { showFeedback } = useFeedbackSafe();
  
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningDetails, setWarningDetails] = useState<ValidationResult | null>(null);
  const [pendingTier, setPendingTier] = useState<"fan" | "artist" | "label" | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [pauseDuration, setPauseDuration] = useState("1");

  const isLoading = authLoading || subLoading;

  const validateTierChange = async (newTier: "fan" | "artist" | "label"): Promise<ValidationResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-tier-change", {
        body: { newTier },
      });

      if (error) throw error;
      return data as ValidationResult;
    } catch (error) {
      console.error("Validation error:", error);
      throw error;
    }
  };

  const handleSubscribe = async (tier: "fan" | "artist" | "label") => {
    setLoadingTier(tier);
    setValidationError(null);
    
    try {
      // Validate tier change first
      const validation = await validateTierChange(tier);
      
      if (!validation.allowed) {
        setValidationError(validation);
        setLoadingTier(null);
        return;
      }

      // If there's a warning (e.g., roster release), show confirmation dialog
      if (validation.warning) {
        setWarningDetails(validation);
        setPendingTier(tier);
        setShowWarningDialog(true);
        setLoadingTier(null);
        return;
      }

      // Show proration info if applicable
      if (validation.prorationInfo) {
        showFeedback({ type: "info", title: "Proration Info", message: validation.prorationInfo.message });
      }

      // Proceed with checkout
      const url = await createSubscriptionCheckout(tier);
      if (url) {
        setIsRedirecting(true);
        setLoadingTier(null);
        await openPaymentUrl(url);
        return;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      showFeedback({ type: "error", title: "Checkout Failed", message: "Failed to start checkout. Please try again." });
    } finally {
      if (!isRedirecting) {
        setLoadingTier(null);
      }
    }
  };

  const handleConfirmWarning = async () => {
    if (!pendingTier) return;
    
    setShowWarningDialog(false);
    setLoadingTier(pendingTier);
    
    try {
      const url = await createSubscriptionCheckout(pendingTier);
      if (url) {
        setIsRedirecting(true);
        setLoadingTier(null);
        await openPaymentUrl(url);
        return;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      showFeedback({ type: "error", title: "Checkout Failed", message: "Failed to start checkout. Please try again." });
    } finally {
      if (!isRedirecting) {
        setLoadingTier(null);
        setPendingTier(null);
        setWarningDetails(null);
      }
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        await openExternalUrl(url);
      }
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        // On native: opens in external browser; on web: redirects
        await openPaymentUrl(url);
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      showFeedback({ 
        type: "error", 
        title: "Error", 
        message: "Failed to open cancellation portal. Please try again." 
      });
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  const handlePauseSubscription = async () => {
    setIsPausing(true);
    try {
      const months = parseInt(pauseDuration, 10);
      const resumeAt = addMonths(new Date(), months).toISOString();
      
      const { data, error } = await supabase.functions.invoke("pause-subscription", {
        body: { action: "pause", resumeAt },
      });

      if (error) throw error;

      const durationText = months === 1 ? "1 month" : `${months} months`;
      showFeedback({ 
        type: "success", 
        title: "Subscription Paused", 
        message: data.message || `Your subscription has been paused for ${durationText}.` 
      });
      setShowPauseDialog(false);
      setPauseDuration("1");
      refreshSubscription();
    } catch (error) {
      console.error("Pause subscription error:", error);
      const message = error instanceof Error ? error.message : "Failed to pause subscription";
      showFeedback({ 
        type: "error", 
        title: "Error", 
        message 
      });
    } finally {
      setIsPausing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsResuming(true);
    try {
      const { data, error } = await supabase.functions.invoke("pause-subscription", {
        body: { action: "resume" },
      });

      if (error) throw error;

      showFeedback({ 
        type: "success", 
        title: "Welcome Back!", 
        message: data.message || "Your subscription is now active again." 
      });
      refreshSubscription();
    } catch (error) {
      console.error("Resume subscription error:", error);
      const message = error instanceof Error ? error.message : "Failed to resume subscription";
      showFeedback({ 
        type: "error", 
        title: "Error", 
        message 
      });
    } finally {
      setIsResuming(false);
    }
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to view and manage your subscription.
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentTierInfo = SUBSCRIPTION_TIERS.find((t) => t.tier === subscription?.tier);
  const recommendedTier = role || "fan";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">Subscription</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your plan and billing</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Validation Error Alert */}
            {validationError && (
              <div className="glass-card p-4 border-destructive/50 bg-destructive/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Cannot Change Plan</h3>
                    <p className="text-sm text-muted-foreground">{validationError.message}</p>
                    {validationError.reason === "has_tracks" && (
                      <div className="mt-3 flex items-center gap-2">
                        <Music className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          You have {validationError.trackCount} track{validationError.trackCount !== 1 ? 's' : ''} uploaded
                        </span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setValidationError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Current Plan Section */}
            {hasActiveSubscription && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Current Plan</h2>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl font-bold text-foreground capitalize">
                        {currentTierInfo?.name || subscription?.tier} Plan
                      </span>
                      {isInTrial && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          Trial
                        </Badge>
                      )}
                      {isPaused && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                          Paused
                        </Badge>
                      )}
                      {subscription?.status === "active" && !isInTrial && !isPaused && (
                        <Badge variant="default">Active</Badge>
                      )}
                      {subscription?.status === "canceled" && (
                        <Badge variant="destructive">Canceled</Badge>
                      )}
                      {subscription?.status === "past_due" && (
                        <Badge variant="destructive">Past Due</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {isInTrial && daysLeftInTrial > 0 && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>{daysLeftInTrial} days left in trial</span>
                        </div>
                      )}
                      {isPaused && pausedUntil && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Pause className="w-4 h-4" />
                          <span>Resumes {format(new Date(pausedUntil), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {subscription?.current_period_end && !isPaused && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {isInTrial ? "Trial ends" : "Renews"}{" "}
                            {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        <span>{currentTierInfo?.price}/month after trial</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={openingPortal}
                    >
                      {openingPortal ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Manage Billing
                    </Button>
                    {/* Resume button when paused */}
                    {isPaused && (
                      <Button
                        onClick={handleResumeSubscription}
                        disabled={isResuming}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isResuming ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Resume Now
                      </Button>
                    )}
                    {/* Pause button when active and not paused */}
                    {subscription?.status === "active" && !isInTrial && !isPaused && (
                      <Button
                        variant="outline"
                        onClick={() => setShowPauseDialog(true)}
                        disabled={isPausing}
                        className="text-orange-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                      >
                        {isPausing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Pause className="w-4 h-4 mr-2" />
                        )}
                        Pause Plan
                      </Button>
                    )}
                    {subscription?.status !== "canceled" && !isInTrial && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowCancelDialog(true)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Plan
                      </Button>
                    )}
                  </div>
                </div>

                {/* Current Plan Features */}
                {currentTierInfo && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Your plan includes:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentTierInfo.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-muted/50 px-2 py-1 rounded-full text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trial Banner for non-subscribers */}
            {!hasActiveSubscription && (
              <div className="glass-card p-6 text-center bg-gradient-to-r from-primary/10 to-accent/10">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Start Your 30-Day Free Trial
                </h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Get unlimited streaming, downloads, and more. No payment required during trial.
                </p>
              </div>
            )}

            {/* Plans Grid */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {hasActiveSubscription ? "Change Plan" : "Choose Your Plan"}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {SUBSCRIPTION_TIERS.map((tierInfo) => {
                  const isCurrentPlan = subscription?.tier === tierInfo.tier && hasActiveSubscription;
                  const isRecommended = tierInfo.tier === recommendedTier && !hasActiveSubscription;

                  return (
                    <div
                      key={tierInfo.tier}
                      className={cn(
                        "glass-card p-6 relative transition-all",
                        isCurrentPlan && "ring-2 ring-primary",
                        isRecommended && !isCurrentPlan && "ring-2 ring-accent"
                      )}
                    >
                      {isCurrentPlan && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                          Current Plan
                        </Badge>
                      )}
                      {isRecommended && !isCurrentPlan && (
                        <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                          Recommended
                        </Badge>
                      )}

                      <div className="text-center mb-4">
                        <Crown className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-foreground">{tierInfo.name}</h3>
                        <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        <span className="text-3xl font-bold text-foreground">{tierInfo.price}</span>
                        <span className="text-muted-foreground">/month</span>
                        {!hasActiveSubscription && (
                          <p className="text-xs text-primary mt-1">Free for 30 days</p>
                        )}
                      </div>

                      <ul className="space-y-2 mb-6">
                        {tierInfo.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button variant="outline" disabled className="w-full">
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          className={cn(
                            "w-full",
                            isRecommended ? "gradient-accent neon-glow-subtle" : ""
                          )}
                          variant={isRecommended ? "default" : "outline"}
                          onClick={() => handleSubscribe(tierInfo.tier)}
                          disabled={loadingTier !== null}
                        >
                          {loadingTier === tierInfo.tier ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {hasActiveSubscription ? "Switch Plan" : "Start Free Trial"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={refreshSubscription}>
                Refresh subscription status
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Warning Confirmation Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Confirm Plan Change
            </DialogTitle>
            <DialogDescription className="text-left">
              {warningDetails?.message}
            </DialogDescription>
          </DialogHeader>
          
          {warningDetails?.warning === "roster_release" && warningDetails.rosterCount && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                {warningDetails.rosterCount} artist{warningDetails.rosterCount !== 1 ? 's' : ''} will be released from your label
              </span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmWarning}
              className="gradient-accent"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>
                Are you sure you want to cancel your <strong className="text-foreground">{currentTierInfo?.name}</strong> subscription?
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Your subscription will remain active until {subscription?.current_period_end ? format(new Date(subscription.current_period_end), "MMM d, yyyy") : "the end of your billing period"}</li>
                <li>You won't be charged again after cancellation</li>
                <li>You can resubscribe anytime</li>
                {(subscription?.tier === "artist" || subscription?.tier === "label") && (
                  <li>Your uploaded tracks will remain available</li>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCanceling}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Opening Portal...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Subscription Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={(open) => {
        setShowPauseDialog(open);
        if (!open) setPauseDuration("1");
      }}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Pause className="w-5 h-5" />
              Pause Subscription
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>
                Need a break? Pause your <strong className="text-foreground">{currentTierInfo?.name}</strong> subscription.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pause Duration</label>
              <Select value={pauseDuration} onValueChange={setPauseDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {PAUSE_DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>No charges while paused</li>
              <li>Automatically resumes after {pauseDuration === "1" ? "1 month" : `${pauseDuration} months`}</li>
              <li>You can resume early anytime</li>
              <li>Your profile and content remain visible</li>
              {(subscription?.tier === "artist" || subscription?.tier === "label") && (
                <li>Your uploaded tracks stay available</li>
              )}
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)} disabled={isPausing}>
              Keep Active
            </Button>
            <Button 
              onClick={handlePauseSubscription}
              disabled={isPausing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isPausing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Pausing...
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause for {pauseDuration === "1" ? "1 Month" : `${pauseDuration} Months`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Loading Overlay */}
      <CheckoutLoadingOverlay isVisible={isRedirecting} />
    </Layout>
  );
}
