import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type CallbackStatus = "verifying" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, role, profile, isLoading } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("verifying");

  // IMPORTANT: useRef (not state) to avoid re-running the effect and clearing timers
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Wait for auth to settle and prevent double redirects
    if (!isLoading && user && !hasRedirectedRef.current) {
      setStatus("success");
      hasRedirectedRef.current = true;

      // Brief delay to show success message
      const timer = window.setTimeout(() => {
        // Use user metadata role as fallback - always available from signup
        const userRole = role || (user.user_metadata?.role as string) || "fan";

        if (userRole === "fan") {
          navigate("/", { replace: true });
        } else if (!profile?.onboarding_completed) {
          // If profile is null or onboarding not completed, go to onboarding
          navigate("/onboarding", { replace: true });
        } else {
          navigate(userRole === "artist" ? "/artist/dashboard" : "/label/dashboard", { replace: true });
        }
      }, 1500);

      return () => window.clearTimeout(timer);
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
  }, [isLoading, user, role, profile, navigate]);

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
