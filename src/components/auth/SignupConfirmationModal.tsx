import { Music, Building2, Headphones, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserRole = "fan" | "artist" | "label";

interface SignupConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole: UserRole;
  displayName: string;
  email: string;
  onConfirm: () => void;
  onChangeRole: () => void;
  isLoading?: boolean;
}

const roleConfig = {
  fan: {
    label: "Fan",
    icon: Headphones,
    description: "Browse, collect, and own music from your favorite artists",
    features: ["Collect tracks from artists", "Build your music library", "Follow your favorite creators"],
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  artist: {
    label: "Artist",
    icon: Music,
    description: "Upload your music, build your fanbase, and earn from sales",
    features: ["Upload unlimited tracks", "Set your own prices", "Earn 85% of every sale"],
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  label: {
    label: "Label",
    icon: Building2,
    description: "Manage multiple artists, releases, and earnings in one place",
    features: ["Manage up to 5 artists", "Centralized dashboard", "Revenue sharing with artists"],
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

export function SignupConfirmationModal({
  open,
  onOpenChange,
  selectedRole,
  displayName,
  email,
  onConfirm,
  onChangeRole,
  isLoading,
}: SignupConfirmationModalProps) {
  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Confirm Your Account</DialogTitle>
          <DialogDescription className="text-center">
            Please review your details before creating your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Card */}
          <div className={`p-4 rounded-lg border border-primary/30 ${config.bgColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signing up as</p>
                <p className={`text-lg font-bold ${config.color}`}>{config.label}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
            <ul className="space-y-1.5">
              {config.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* User Details */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-glass-border">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium text-foreground">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{email}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full gradient-accent neon-glow-subtle hover:neon-glow"
          >
            {isLoading ? "Creating Account..." : "Create My Account"}
          </Button>
          <Button
            variant="ghost"
            onClick={onChangeRole}
            disabled={isLoading}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Change Account Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
