import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export type MotionTier = "basic" | "performance" | "cinematic";

interface LiveAvatarPreviewProps {
  src: string;
  className?: string;
  showBadge?: boolean;
  tier?: MotionTier;
}

const TIER_CONFIG: Record<MotionTier, { badge: string; kenBurns: string; breathe: string; glow: string; extra: string }> = {
  basic: {
    badge: "Live Avatar Ready",
    kenBurns: "animate-ken-burns",
    breathe: "animate-avatar-breathe",
    glow: "animate-avatar-glow opacity-60",
    extra: "",
  },
  performance: {
    badge: "Performance Avatar",
    kenBurns: "animate-ken-burns-slow",
    breathe: "animate-avatar-breathe",
    glow: "animate-avatar-glow-strong opacity-80",
    extra: "",
  },
  cinematic: {
    badge: "Cinematic Avatar",
    kenBurns: "animate-ken-burns-cinematic",
    breathe: "animate-avatar-breathe-slow",
    glow: "animate-avatar-glow-cinematic opacity-90",
    extra: "[perspective:1000px]",
  },
};

export function LiveAvatarPreview({ src, className, showBadge = true, tier = "basic" }: LiveAvatarPreviewProps) {
  const config = TIER_CONFIG[tier];

  return (
    <div className={cn("relative overflow-hidden rounded-lg group", config.extra, className)}>
      {/* Ambient glow border */}
      <div className={cn("absolute inset-0 rounded-lg pointer-events-none z-10 ring-2 ring-primary/0", config.glow)} />

      {/* Ken Burns zoom + breathing float */}
      <div className={config.kenBurns}>
        <img
          src={src}
          alt="Live Avatar"
          className={cn("w-full aspect-square object-cover", config.breathe)}
          style={tier === "cinematic" ? { transform: "rotateY(2deg)" } : undefined}
        />
      </div>

      {/* Vignette overlay — deeper for cinematic */}
      <div className={cn(
        "absolute inset-0 pointer-events-none z-10",
        tier === "cinematic"
          ? "bg-gradient-to-t from-background/60 via-transparent to-background/20"
          : "bg-gradient-to-t from-background/40 via-transparent to-transparent"
      )} />

      {/* Live badge */}
      {showBadge && (
        <div className="absolute top-2 left-2 z-20">
          <Badge className={cn(
            "backdrop-blur-sm gap-1 text-[10px]",
            tier === "cinematic"
              ? "bg-accent/80 text-accent-foreground"
              : "bg-primary/80 text-primary-foreground"
          )}>
            <Sparkles className="h-2.5 w-2.5" />
            {config.badge}
          </Badge>
        </div>
      )}
    </div>
  );
}
