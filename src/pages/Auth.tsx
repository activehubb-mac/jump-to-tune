import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Mail, Lock, User, Building2, Headphones, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";
type UserRole = "fan" | "artist" | "label";

const roles: { value: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: "fan", label: "Fan", icon: Headphones, description: "Collect and own music" },
  { value: "artist", label: "Artist", icon: Music, description: "Upload and sell your music" },
  { value: "label", label: "Label", icon: Building2, description: "Manage artists and releases" },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>((searchParams.get("mode") as AuthMode) || "signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>((searchParams.get("role") as UserRole) || "fan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlMode = searchParams.get("mode") as AuthMode;
    const urlRole = searchParams.get("role") as UserRole;
    if (urlMode) setMode(urlMode);
    if (urlRole) setSelectedRole(urlRole);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }
    }

    // TODO: Implement actual auth with Supabase
    setTimeout(() => {
      setIsLoading(false);
      // Placeholder - will be replaced with actual auth
      console.log("Auth attempt:", { mode, email, selectedRole, displayName });
    }, 1000);
  };

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
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center neon-glow-subtle">
                <Music className="w-7 h-7 text-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === "signin" ? "Welcome Back" : "Join JumTunes"}
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

            {/* Role Selection for Signup */}
            {mode === "signup" && (
              <div className="mb-6">
                <Label className="text-sm text-muted-foreground mb-3 block">I am a...</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={cn(
                          "p-3 rounded-lg border transition-all duration-200 text-center",
                          selectedRole === role.value
                            ? "border-primary bg-primary/10 neon-glow-subtle"
                            : "border-glass-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 mx-auto mb-1",
                            selectedRole === role.value ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            selectedRole === role.value ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {role.label}
                        </span>
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
                <a href="#" className="text-primary hover:underline">
                  Forgot your password?
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
