import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle, KeyRound, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";

type PageState = "loading" | "ready" | "expired" | "success";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState("");
  const [expiredMessage, setExpiredMessage] = useState("");
  const navigate = useNavigate();
  const { showFeedback } = useFeedbackSafe();
  const { user } = useAuth();

  // Check for error parameters and session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      // Check URL hash for error parameters (Supabase puts them in the hash fragment)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");

      // Also check query params (some flows use query params instead)
      const queryParams = new URLSearchParams(window.location.search);
      const queryErrorCode = queryParams.get("error_code");
      const queryErrorDescription = queryParams.get("error_description");

      const finalErrorCode = errorCode || queryErrorCode;
      const finalErrorDescription = errorDescription || queryErrorDescription;

      if (finalErrorCode === "otp_expired" || finalErrorCode === "access_denied") {
        setExpiredMessage(
          finalErrorDescription?.replace(/\+/g, " ") || 
          "Your password reset link has expired or is invalid."
        );
        setPageState("expired");
        return;
      }

      // Check if user has a valid session (required for password update)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setPageState("ready");
      } else {
        // No session and no error - could be direct navigation
        setExpiredMessage("No active session. Please request a new password reset link.");
        setPageState("expired");
      }
    };

    checkAuthState();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (updateError) {
      if (updateError.message.includes("session")) {
        setExpiredMessage("Your session has expired. Please request a new password reset link.");
        setPageState("expired");
      } else {
        setError(updateError.message);
        showFeedback({
          type: "error",
          title: "Password Update Failed",
          message: updateError.message,
        });
      }
    } else {
      setPageState("success");
      showFeedback({
        type: "success",
        title: "Password Updated!",
        message: "Your password has been successfully changed.",
        autoClose: true,
        autoCloseDelay: 2000,
      });
      
      // Redirect to auth page after a brief delay
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          </div>
          <div className="glass-card p-12 space-y-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verifying your reset link...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Expired/Invalid link state
  if (pageState === "expired") {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          </div>

          <div className="w-full max-w-md relative z-10 text-center">
            <div className="glass-card p-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Link Expired or Invalid
                </h2>
                <p className="text-muted-foreground text-sm">
                  {expiredMessage}
                </p>
              </div>
              
              <div className="space-y-3 pt-2">
                <Button
                  className="w-full gradient-accent neon-glow-subtle hover:neon-glow"
                  asChild
                >
                  <Link to="/auth?mode=signin&forgot=1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Request New Reset Link
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-glass-border"
                  asChild
                >
                  <Link to="/auth">
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          </div>

          <div className="w-full max-w-md relative z-10 text-center">
            <div className="glass-card p-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Password Updated!</h2>
              <p className="text-muted-foreground">Redirecting to sign in...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Ready state - show form
  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center neon-glow-subtle">
                <KeyRound className="w-8 h-8 text-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Set New Password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your new password below
            </p>
          </div>

          {/* Form Card */}
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted/50 border-glass-border focus:border-primary"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-muted/50 border-glass-border focus:border-primary"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-accent neon-glow-subtle hover:neon-glow transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
