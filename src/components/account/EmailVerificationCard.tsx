import { useState } from "react";
import { Mail, CheckCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { cn } from "@/lib/utils";

// Helper to detect email provider and get quick link
const getEmailProvider = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  
  if (domain.includes("gmail") || domain.includes("googlemail")) {
    return { name: "Gmail", url: "https://mail.google.com" };
  }
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return { name: "Outlook", url: "https://outlook.live.com" };
  }
  if (domain.includes("yahoo")) {
    return { name: "Yahoo Mail", url: "https://mail.yahoo.com" };
  }
  if (domain.includes("icloud") || domain.includes("me.com") || domain.includes("mac.com")) {
    return { name: "iCloud Mail", url: "https://www.icloud.com/mail" };
  }
  if (domain.includes("proton") || domain.includes("protonmail")) {
    return { name: "ProtonMail", url: "https://mail.proton.me" };
  }
  return null;
};

export function EmailVerificationCard() {
  const { user, isEmailVerified, resendConfirmationEmail } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!user) return null;

  const emailProvider = getEmailProvider(user.email || "");

  const handleResend = async () => {
    if (!user.email || isResending || resendCooldown > 0) return;
    
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
      setResendCooldown(60);
      // Start cooldown timer
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
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
    <div className="glass-card p-6">
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          isEmailVerified ? "bg-green-500/10" : "bg-amber-500/10"
        )}>
          {isEmailVerified ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">Email Verification</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full w-fit",
              isEmailVerified 
                ? "bg-green-500/10 text-green-500" 
                : "bg-amber-500/10 text-amber-500"
            )}>
              {isEmailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-1 truncate">
            {user.email}
          </p>

          {isEmailVerified ? (
            <p className="text-xs text-muted-foreground">
              Verified on {new Date(user.email_confirmed_at!).toLocaleDateString()}
            </p>
          ) : (
            <div className="space-y-3 mt-3">
              <p className="text-sm text-muted-foreground">
                Please verify your email to unlock all features.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}
                </Button>
                
                {emailProvider && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <a href={emailProvider.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open {emailProvider.name}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
