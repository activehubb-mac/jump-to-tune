import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Music,
  Upload,
  Heart,
  Download,
  Users,
  BarChart3,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppRole = "fan" | "artist" | "label";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const FAN_TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to JumTunes! 🎉",
    description: "You're now part of a music revolution. Own the tracks you love, support artists directly, and build your collection.",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    title: "Discover Music",
    description: "Browse trending tracks and discover new artists. Every purchase means you own that track forever.",
    icon: <Music className="w-8 h-8" />,
    highlight: "Browse",
  },
  {
    title: "Build Your Collection",
    description: "Purchased tracks appear in your Collection. Listen anytime, download in high quality, and show off your taste.",
    icon: <Heart className="w-8 h-8" />,
    highlight: "Collection",
  },
  {
    title: "Download & Own",
    description: "Download tracks in MP3 or lossless WAV format. They're yours forever, no strings attached.",
    icon: <Download className="w-8 h-8" />,
  },
  {
    title: "Wallet & Credits",
    description: "Top up your wallet with credits for faster checkout. View your transaction history anytime.",
    icon: <Wallet className="w-8 h-8" />,
    highlight: "Wallet",
  },
];

const ARTIST_TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome, Artist! 🎤",
    description: "Your creative home awaits. Upload your music, connect with fans, and keep 85% of every sale.",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    title: "Upload Your Music",
    description: "Share your tracks with the world. Set your own prices, edition limits, and add cover art.",
    icon: <Upload className="w-8 h-8" />,
    highlight: "Upload",
  },
  {
    title: "Your Dashboard",
    description: "Track your sales, see who's collecting your music, and monitor your growth - all in one place.",
    icon: <BarChart3 className="w-8 h-8" />,
    highlight: "Dashboard",
  },
  {
    title: "Connect with Fans",
    description: "Build your fanbase. Fans who own your tracks are your biggest supporters.",
    icon: <Users className="w-8 h-8" />,
  },
  {
    title: "Get Paid",
    description: "Earnings go directly to your wallet. Connect Stripe to withdraw anytime.",
    icon: <Wallet className="w-8 h-8" />,
    highlight: "Payouts",
  },
];

const LABEL_TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome, Label! 🏢",
    description: "Manage your roster, distribute music, and grow your artists' careers - all from one dashboard.",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    title: "Your Roster",
    description: "Invite artists to join your label. Manage up to 5 artists on your current plan.",
    icon: <Users className="w-8 h-8" />,
    highlight: "Roster",
  },
  {
    title: "Upload for Artists",
    description: "Release music on behalf of your artists. All sales are tracked and attributed correctly.",
    icon: <Upload className="w-8 h-8" />,
    highlight: "Upload",
  },
  {
    title: "Label Analytics",
    description: "See the big picture. Track total sales, top performers, and growth across your entire catalog.",
    icon: <BarChart3 className="w-8 h-8" />,
    highlight: "Analytics",
  },
  {
    title: "Manage Payouts",
    description: "Handle artist payouts from a central dashboard. Keep everything organized and transparent.",
    icon: <Wallet className="w-8 h-8" />,
    highlight: "Payouts",
  },
];

interface OnboardingTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AppRole;
  onComplete: () => void;
}

export function OnboardingTour({
  open,
  onOpenChange,
  role,
  onComplete,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps =
    role === "artist"
      ? ARTIST_TOUR_STEPS
      : role === "label"
      ? LABEL_TOUR_STEPS
      : FAN_TOUR_STEPS;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      onOpenChange(false);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        {/* Close / Skip button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Skip tour</span>
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-6 pb-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentStep
                  ? "bg-primary w-6"
                  : i < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center space-y-4"
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-foreground neon-glow">
                  {step.icon}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  {step.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Highlight badge */}
              {step.highlight && (
                <div className="flex justify-center">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    Look for: {step.highlight}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 border-border"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn(
                "gradient-accent neon-glow-subtle hover:neon-glow",
                isFirstStep ? "w-full" : "flex-1"
              )}
            >
              {isLastStep ? "Let's Go!" : "Next"}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Skip text */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
