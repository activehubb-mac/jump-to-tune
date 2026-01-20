import { useState } from "react";
import { AlertTriangle, Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export function EmailVerificationBanner() {
  const { user, resendConfirmationEmail } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at != null;

  // Don't show if verified, dismissed, or no user
  if (!user || isEmailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (!user.email || isResending) return;
    
    setIsResending(true);
    const { error } = await resendConfirmationEmail(user.email);
    setIsResending(false);

    if (error) {
      showFeedback({
        type: "error",
        title: "Failed to Send",
        message: "Could not send verification email. Please try again later.",
      });
    } else {
      showFeedback({
        type: "success",
        title: "Email Sent!",
        message: `Verification email sent to ${user.email}`,
        autoClose: true,
        autoCloseDelay: 3000,
      });
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-200 truncate">
              <span className="font-medium">Verify your email</span>
              <span className="hidden sm:inline"> to unlock all features</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 text-xs"
            >
              {isResending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Mail className="w-3 h-3 mr-1" />
              )}
              Resend
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDismissed(true)}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 w-7"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
