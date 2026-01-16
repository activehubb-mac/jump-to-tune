import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showFeedback } = useFeedbackSafe();

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
      setError(updateError.message);
      showFeedback({
        type: "error",
        title: "Password Update Failed",
        message: updateError.message,
      });
    } else {
      setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          {/* Background Effects */}
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
