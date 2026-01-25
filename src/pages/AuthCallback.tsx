import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";

type CallbackStatus = "verifying" | "success" | "error";

// Analytics logging for redirect failures
const logRedirectEvent = (event: string, data: Record<string, unknown>) => {
  console.log(`[AuthCallback Analytics] ${event}`, data);
  
  // Future: Send to analytics service
  // analytics.track(event, data);
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, profile, isLoading } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [redirectProgress, setRedirectProgress] = useState(0);
  const { fireConfetti } = useConfetti();
  
  // Onboarding tour state
  const {
    showTour,
    setShowTour,
    completeTour,
    triggerTourForNewUser,
  } = useOnboardingTour(user?.id);

  // IMPORTANT: useRef (not state) to avoid re-running the effect and clearing timers
  const hasRedirectedRef = useRef(false);
  const hasProcessedRef = useRef(false);
  const redirectStartTimeRef = useRef<number | null>(null);

  // Debug mode via ?debug=1
  const debugMode = searchParams.get("debug") === "1";

  // Compute target route
  const targetRoute = useMemo(() => {
    if (!user) return null;
    
    const userRole = role || (user.user_metadata?.role as string) || "fan";
    
    if (userRole === "fan") {
      return "/";
    } else if (!profile?.onboarding_completed) {
      return "/onboarding";
    } else {
      return userRole === "artist" ? "/artist/dashboard" : "/label/dashboard";
    }
  }, [user, role, profile]);

  // Debug logging
  useEffect(() => {
    if (debugMode) {
      console.log("[AuthCallback Debug]", {
        isLoading,
        user: user ? { id: user.id, email: user.email, metadata: user.user_metadata } : null,
        role,
        profile: profile ? { 
          id: profile.id, 
          onboarding_completed: profile.onboarding_completed 
        } : null,
        targetRoute,
        hasRedirected: hasRedirectedRef.current,
      });
    }
  }, [debugMode, isLoading, user, role, profile, targetRoute]);

  // Send welcome email on successful verification - ONLY for fans
  // Artists/Labels get their welcome email after completing onboarding
  useEffect(() => {
    if (!isLoading && user && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      
      const userRole = role || (user.user_metadata?.role as string) || "fan";
      
      // Only send welcome email immediately for fans
      // Artists/Labels receive it after onboarding completion
      if (userRole === "fan") {
        const displayName = profile?.display_name || user.user_metadata?.display_name || "";
        
        supabase.functions
          .invoke("send-welcome-email", {
            body: {
              email: user.email,
              displayName,
              role: userRole,
            },
          })
          .then(({ error }) => {
            if (error) {
              console.error("Failed to send welcome email:", error);
            } else {
              console.log("Welcome email sent successfully");
            }
          });
      }
    }
  }, [isLoading, user, role, profile]);

  // Progress bar animation during redirect
  useEffect(() => {
    if (status === "success" && !showContinueButton) {
      const interval = setInterval(() => {
        setRedirectProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 4; // ~2.5 seconds to complete
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [status, showContinueButton]);

  // Main redirect logic
  useEffect(() => {
    // Wait for auth to settle and prevent double redirects
    if (!isLoading && user && !hasRedirectedRef.current) {
      setStatus("success");
      hasRedirectedRef.current = true;
      redirectStartTimeRef.current = Date.now();

      // Fire celebratory confetti!
      fireConfetti();

      // Show toast notification
      toast({
        title: "Email Verified! ✓",
        description: "Welcome to JumTunes. Redirecting you now...",
      });

      // For fans, pass tour trigger via URL param to Index page
      const userRole = role || (user.user_metadata?.role as string) || "fan";
      const redirectWithTour = userRole === "fan" ? "/?tour=1" : targetRoute;

      logRedirectEvent("redirect_initiated", {
        userId: user.id,
        role: userRole,
        targetRoute: redirectWithTour,
      });

      if (debugMode) {
        console.log("[AuthCallback Debug] Scheduling redirect to:", redirectWithTour);
      }

      // Brief delay to show success message
      const redirectTimer = window.setTimeout(() => {
        if (redirectWithTour) {
          navigate(redirectWithTour, { replace: true });
        }
      }, 1500);

      return () => {
        window.clearTimeout(redirectTimer);
      };
    }

    // Handle case where user is not authenticated after a timeout
    if (!isLoading && !user) {
      const timer = window.setTimeout(() => {
        if (!user) {
          setStatus("error");
          logRedirectEvent("verification_failed", {
            reason: "no_user_after_timeout",
          });
          window.setTimeout(() => {
            navigate("/auth", { replace: true });
          }, 2000);
        }
      }, 3000);

      return () => window.clearTimeout(timer);
    }
  }, [isLoading, user, targetRoute, navigate, debugMode, role, fireConfetti]);

  // Separate fallback timer - always runs when status is "success"
  useEffect(() => {
    if (status === "success") {
      const fallbackTimer = window.setTimeout(() => {
        setShowContinueButton(true);
        
        // Log redirect failure when fallback button appears
        const duration = redirectStartTimeRef.current 
          ? Date.now() - redirectStartTimeRef.current 
          : null;
        
        logRedirectEvent("redirect_failed", {
          userId: user?.id,
          role: role || user?.user_metadata?.role || "fan",
          targetRoute,
          durationMs: duration,
          userAgent: navigator.userAgent,
        });
      }, 3000);

      return () => window.clearTimeout(fallbackTimer);
    }
  }, [status, user, role, targetRoute]);

  const handleContinue = () => {
    logRedirectEvent("manual_continue_clicked", {
      userId: user?.id,
      targetRoute,
    });
    
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <Layout showFooter={false} useBackground="futuristic">
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        </div>

        <div className="text-center relative z-10">
          {status === "verifying" && (
            <div className="glass-card p-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">Verifying your email...</h2>
              <p className="text-muted-foreground">Please wait a moment</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="glass-card p-12 space-y-4 min-w-[320px]">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Email Verified!</h2>
              
              {/* Progress bar during redirect */}
              {!showContinueButton && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Redirecting you now...</p>
                  <Progress value={redirectProgress} className="h-1.5 w-full" />
                </div>
              )}
              
              {/* Fallback continue button */}
              {showContinueButton && (
                <div className="pt-2 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Not redirecting automatically?
                  </p>
                  <Button onClick={handleContinue} className="gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Debug info */}
              {debugMode && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left text-xs font-mono">
                  <p><strong>Role:</strong> {role || user?.user_metadata?.role || "fan"}</p>
                  <p><strong>Profile:</strong> {profile ? "loaded" : "null"}</p>
                  <p><strong>Onboarding:</strong> {String(profile?.onboarding_completed)}</p>
                  <p><strong>Target:</strong> {targetRoute}</p>
                  <p><strong>Progress:</strong> {redirectProgress}%</p>
                </div>
              )}
            </div>
          )}
          
          {status === "error" && (
            <div className="glass-card p-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
              <p className="text-muted-foreground">Redirecting to sign in...</p>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Tour Modal */}
      <OnboardingTour
        open={showTour}
        onOpenChange={setShowTour}
        role={(role || (user?.user_metadata?.role as "fan" | "artist" | "label") || "fan")}
        onComplete={completeTour}
      />
    </Layout>
  );
}
