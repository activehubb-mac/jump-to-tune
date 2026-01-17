import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";

type CallbackStatus = "verifying" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, profile, isLoading } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const { fireConfetti } = useConfetti();

  // IMPORTANT: useRef (not state) to avoid re-running the effect and clearing timers
  const hasRedirectedRef = useRef(false);

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

  useEffect(() => {
    // Wait for auth to settle and prevent double redirects
    if (!isLoading && user && !hasRedirectedRef.current) {
      setStatus("success");
      hasRedirectedRef.current = true;

      // Fire celebratory confetti!
      fireConfetti();

      // Show toast notification
      toast({
        title: "Email Verified! ✓",
        description: "Welcome to JumTunes. Redirecting you now...",
      });

      if (debugMode) {
        console.log("[AuthCallback Debug] Scheduling redirect to:", targetRoute);
      }

      // Brief delay to show success message
      const redirectTimer = window.setTimeout(() => {
        if (targetRoute) {
          navigate(targetRoute, { replace: true });
        }
      }, 1500);

      // Show continue button after 3s as fallback
      const fallbackTimer = window.setTimeout(() => {
        setShowContinueButton(true);
      }, 3000);

      return () => {
        window.clearTimeout(redirectTimer);
        window.clearTimeout(fallbackTimer);
      };
    }

    // Handle case where user is not authenticated after a timeout
    if (!isLoading && !user) {
      const timer = window.setTimeout(() => {
        if (!user) {
          setStatus("error");
          window.setTimeout(() => {
            navigate("/auth", { replace: true });
          }, 2000);
        }
      }, 3000);

      return () => window.clearTimeout(timer);
    }
  }, [isLoading, user, targetRoute, navigate, debugMode]);

  const handleContinue = () => {
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <Layout showFooter={false}>
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
            <div className="glass-card p-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Email Verified!</h2>
              <p className="text-muted-foreground">Redirecting you now...</p>
              
              {/* Fallback continue button */}
              {showContinueButton && (
                <div className="pt-4 space-y-2">
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
    </Layout>
  );
}
