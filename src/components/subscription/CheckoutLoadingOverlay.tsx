import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function CheckoutLoadingOverlay({ 
  isVisible, 
  message = "Preparing secure checkout..." 
}: CheckoutLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        "bg-background/80 backdrop-blur-md transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-6 text-center p-8 max-w-sm">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <CreditCard className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-lg font-medium text-foreground">{message}</span>
        </div>

        {/* Security Note */}
        <p className="text-sm text-muted-foreground">
          You'll be redirected to Stripe's secure payment page.
        </p>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
