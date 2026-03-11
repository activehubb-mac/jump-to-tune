import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeedback, FeedbackType } from "@/contexts/FeedbackContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const feedbackConfig: Record<FeedbackType, { icon: typeof CheckCircle; colorClass: string; glowClass: string }> = {
  success: {
    icon: CheckCircle,
    colorClass: "text-primary",
    glowClass: "shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
  },
  error: {
    icon: XCircle,
    colorClass: "text-destructive",
    glowClass: "shadow-[0_0_20px_hsl(var(--destructive)/0.4)]",
  },
  warning: {
    icon: AlertTriangle,
    colorClass: "text-amber-500",
    glowClass: "shadow-[0_0_20px_hsl(38_92%_50%/0.4)]",
  },
  info: {
    icon: Info,
    colorClass: "text-secondary",
    glowClass: "shadow-[0_0_20px_hsl(var(--secondary)/0.4)]",
  },
  confirm: {
    icon: HelpCircle,
    colorClass: "text-primary",
    glowClass: "shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
  },
};

export function FeedbackModal() {
  const { feedback, isOpen, closeFeedback } = useFeedback();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeFeedback();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeFeedback]);

  if (!feedback) return null;

  const config = feedbackConfig[feedback.type];
  const Icon = config.icon;

  const handlePrimaryAction = () => {
    feedback.primaryAction?.onClick();
    if (feedback.type !== "confirm") {
      closeFeedback();
    }
  };

  const handleSecondaryAction = () => {
    feedback.secondaryAction?.onClick();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeFeedback()}>
      <DialogContent className="sm:max-w-md glass-card border-glass-border/30">
        <button
          onClick={closeFeedback}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              "bg-muted",
              config.glowClass
            )}
          >
            <Icon className={cn("w-8 h-8", config.colorClass)} />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {feedback.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {feedback.message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          {feedback.secondaryAction && (
            <Button
              variant="outline"
              onClick={handleSecondaryAction}
              className="flex-1 border-glass-border hover:bg-muted/50"
            >
              {feedback.secondaryAction.label}
            </Button>
          )}
          {feedback.primaryAction && (
            <Button
              variant={feedback.primaryAction.variant === "destructive" ? "destructive" : "default"}
              onClick={handlePrimaryAction}
              className={cn(
                "flex-1",
                feedback.primaryAction.variant !== "destructive" &&
                  "gradient-accent neon-glow-subtle hover:neon-glow"
              )}
            >
              {feedback.primaryAction.label}
            </Button>
          )}
          {!feedback.primaryAction && !feedback.secondaryAction && (
            <Button
              onClick={closeFeedback}
              className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
            >
              Got it
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
