import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Mail, Lock, User, Building2, Headphones, ArrowRight, Loader2, RefreshCw, ArrowLeft, KeyRound, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { SignupConfirmationModal } from "@/components/auth/SignupConfirmationModal";

type AuthMode = "signin" | "signup";
type UserRole = "fan" | "artist" | "label";

const roles: { value: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: "fan", label: "Fan", icon: Headphones, description: "Browse, collect, and own music from your favorite artists" },
  { value: "artist", label: "Artist", icon: Music, description: "Upload your music, build your fanbase, and earn from sales" },
  { value: "label", label: "Label", icon: Building2, description: "Manage multiple artists, releases, and earnings in one place" },
];

// Helper to detect email provider and get quick link
const getEmailProvider = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  
  if (domain.includes("gmail") || domain.includes("googlemail")) {
    return { name: "Gmail", url: "https://mail.google.com", color: "text-primary" };
  }
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return { name: "Outlook", url: "https://outlook.live.com", color: "text-primary" };
  }
  if (domain.includes("yahoo")) {
    return { name: "Yahoo Mail", url: "https://mail.yahoo.com", color: "text-primary" };
  }
  if (domain.includes("icloud") || domain.includes("me.com") || domain.includes("mac.com")) {
    return { name: "iCloud Mail", url: "https://www.icloud.com/mail", color: "text-primary" };
  }
  if (domain.includes("proton") || domain.includes("protonmail")) {
    return { name: "ProtonMail", url: "https://mail.proton.me", color: "text-primary" };
  }
  return null;
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, profile, signIn, signUp, resendConfirmationEmail, resetPassword, isLoading: authLoading } = useAuth();
  const { showFeedback, closeFeedback } = useFeedbackSafe();
  
  const [mode, setMode] = useState<AuthMode>((searchParams.get("mode") as AuthMode) || "signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>((searchParams.get("role") as UserRole) || "fan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Email confirmation states
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Signup confirmation modal state
  const [showSignupConfirmation, setShowSignupConfirmation] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading && profile !== null) {
      // Artists and labels: check onboarding status
      if (role === "artist" || role === "label") {
        if (profile.onboarding_completed) {
          // Already onboarded - go to their dashboard
          navigate(role === "artist" ? "/artist/dashboard" : "/label/dashboard");
        } else {
          // Not yet onboarded - go to onboarding
          navigate("/onboarding");
        }
      } else {
        // Fans go home
        navigate("/");
      }
    }
  }, [user, role, profile, authLoading, navigate]);

  useEffect(() => {
    const urlMode = searchParams.get("mode") as AuthMode;
    const urlRole = searchParams.get("role") as UserRole;
    if (urlMode) setMode(urlMode);
    if (urlRole) setSelectedRole(urlRole);
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (isResending || resendCooldown > 0) return;
    
    setIsResending(true);
    const { error } = await resendConfirmationEmail(pendingEmail);
    setIsResending(false);
    
    if (error) {
      showFeedback({
        type: "error",
        title: "Failed to Resend",
        message: error.message || "Could not resend confirmation email. Please try again.",
        primaryAction: {
          label: "Try Again",
          onClick: () => {
            closeFeedback();
            handleResendEmail();
          },
        },
      });
    } else {
      setResendCooldown(60);
      showFeedback({
        type: "success",
        title: "Email Sent!",
        message: `We've sent a new confirmation email to ${pendingEmail}`,
        autoClose: true,
        autoCloseDelay: 3000,
      });
    }
  };

  const handleBackToSignIn = () => {
    setShowEmailConfirmation(false);
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setPendingEmail("");
    setMode("signin");
    setError("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    const { error: resetError } = await resetPassword(email);
    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setResetEmailSent(true);
    setPendingEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        setError("Please enter a display name");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Show confirmation modal instead of directly signing up
      setShowSignupConfirmation(true);
    } else {
      setIsLoading(true);
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          // Just show the email confirmation screen - no modal overlay needed
          setPendingEmail(email);
          setShowEmailConfirmation(true);
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      showFeedback({
        type: "success",
        title: "Welcome Back!",
        message: "You have successfully signed in.",
        autoClose: true,
        autoCloseDelay: 2000,
      });
      navigate("/");
    }
  };

  // Handle actual signup after confirmation
  const handleConfirmedSignup = async () => {
    setIsLoading(true);

    const { error: signUpError, existingUser } = await signUp(email, password, displayName, selectedRole);
    
    if (signUpError) {
      setShowSignupConfirmation(false);
      if (signUpError.message.includes("already registered") || existingUser) {
        showFeedback({
          type: "warning",
          title: "Account May Already Exist",
          message: "If you already have an account, please sign in. Otherwise, check your email for a confirmation link.",
          primaryAction: {
            label: "Sign In Instead",
            onClick: () => {
              closeFeedback();
              setMode("signin");
            },
          },
        });
        setIsLoading(false);
        return;
      }
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Show email confirmation screen
    setShowSignupConfirmation(false);
    setPendingEmail(email);
    setShowEmailConfirmation(true);
    setIsLoading(false);
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Email Confirmation Screen
  if (showEmailConfirmation) {
    const emailProvider = getEmailProvider(pendingEmail);
    
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          </div>

          <div className="w-full max-w-md relative z-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <Mail className="w-8 h-8 text-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Check Your Email</h1>
              <p className="text-muted-foreground mt-2">
                We've sent a confirmation link to
              </p>
              <p className="text-primary font-medium mt-1">{pendingEmail}</p>
            </div>

            {/* Confirmation Card */}
            <div className="glass-card p-8 text-center space-y-6">
              {/* Quick Open Email Button */}
              {emailProvider && (
                <a
                  href={emailProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg",
                    "bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors",
                    "text-primary font-medium"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open {emailProvider.name}
                </a>
              )}

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/30 border border-glass-border">
                  <p className="text-foreground text-sm font-medium mb-2">
                    📬 What to do next:
                  </p>
                  <ol className="text-muted-foreground text-sm text-left space-y-1.5 list-decimal list-inside">
                    <li>Open your email inbox</li>
                    <li>Look for an email from <span className="text-foreground">JumTunes</span></li>
                    <li>Click the <span className="text-primary">"Confirm Email"</span> button</li>
                  </ol>
                </div>
                
                <div className="flex items-center gap-2 justify-center text-amber-400 text-xs">
                  <span>💡</span>
                  <span>Can't find it? Check your <strong>spam</strong> or <strong>junk</strong> folder!</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-muted-foreground text-xs">
                  Still no email after a few minutes?
                </p>
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || resendCooldown > 0}
                  variant="outline"
                  className="w-full border-glass-border hover:bg-muted/50"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Confirmation Email"}
                </Button>

                <Button
                  onClick={handleBackToSignIn}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Forgot Password Screen
  if (showForgotPassword) {
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
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  {resetEmailSent ? (
                    <Mail className="w-8 h-8 text-foreground" />
                  ) : (
                    <KeyRound className="w-8 h-8 text-foreground" />
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {resetEmailSent ? "Check Your Email" : "Reset Password"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {resetEmailSent
                  ? "We've sent a password reset link to"
                  : "Enter your email to receive a reset link"}
              </p>
              {resetEmailSent && (
                <p className="text-primary font-medium mt-1">{pendingEmail}</p>
              )}
            </div>

            {/* Forgot Password Card */}
            <div className="glass-card p-8">
              {resetEmailSent ? (
                <div className="text-center space-y-6">
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-sm">
                      Click the link in the email to reset your password.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Don't see it? Check your spam folder.
                    </p>
                  </div>

                  <Button
                    onClick={handleBackToSignIn}
                    variant="outline"
                    className="w-full border-glass-border hover:bg-muted/50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-foreground">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                      "Send Reset Link"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={handleBackToSignIn}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      {/* Signup Confirmation Modal */}
      <SignupConfirmationModal
        open={showSignupConfirmation}
        onOpenChange={setShowSignupConfirmation}
        selectedRole={selectedRole}
        displayName={displayName}
        email={email}
        onConfirm={handleConfirmedSignup}
        onChangeRole={() => setShowSignupConfirmation(false)}
        isLoading={isLoading}
      />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/jumtunes-logo.png" 
                alt="JumTunes" 
                className="h-64 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === "signin" ? "Welcome Back" : "Join Us"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "signin"
                ? "Sign in to continue to your account"
                : "Create your account and start collecting"}
            </p>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-8">
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg mb-6">
              <button
                onClick={() => setMode("signin")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  mode === "signin"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  mode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign Up
              </button>
            </div>

            {/* Role Selection for Signup - Enhanced */}
            {mode === "signup" && (
              <div className="mb-6 space-y-3">
                <div className="text-center pb-1">
                  <Label className="text-base font-semibold text-foreground">Choose Your Account Type</Label>
                  <p className="text-xs text-muted-foreground mt-1">This determines what features you'll have access to</p>
                </div>
                <div className="space-y-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={cn(
                          "w-full p-4 rounded-lg border transition-all duration-200 flex items-center gap-3 text-left",
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30 neon-glow-subtle"
                            : "border-glass-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary/20" : "bg-muted/50"
                        )}>
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "font-medium block",
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {role.label}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {role.description}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-foreground">
                    {selectedRole === "label" ? "Label Name" : "Display Name"}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder={selectedRole === "label" ? "Your label name" : "Your name"}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 bg-muted/50 border-glass-border focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted/50 border-glass-border focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
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
                  />
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
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
              )}

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
                  <>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {mode === "signin" && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowForgotPassword(true);
                  }}
                  className="text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
