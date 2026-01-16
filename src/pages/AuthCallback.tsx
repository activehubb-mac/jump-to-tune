import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type CallbackStatus = "verifying" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, role, profile, isLoading } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Wait for auth to settle and prevent double redirects
    if (!isLoading && user && profile !== null && !hasRedirected) {
      setStatus("success");
      setHasRedirected(true);
      
      // Brief delay to show success message
      const timer = setTimeout(() => {
        if (role === "fan") {
          navigate("/", { replace: true });
        } else if (!profile.onboarding_completed) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate(role === "artist" ? "/artist/dashboard" : "/label/dashboard", { replace: true });
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Handle case where user is not authenticated after a timeout
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        if (!user) {
          setStatus("error");
          setTimeout(() => {
            navigate("/auth", { replace: true });
          }, 2000);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, user, role, profile, navigate, hasRedirected]);

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
