import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface LiveAvatarPreviewProps {
  src: string;
  className?: string;
  showBadge?: boolean;
  motionTier?: "basic" | "performance" | "cinematic";
}

export function LiveAvatarPreview({ src, className, showBadge = true, motionTier = "basic" }: LiveAvatarPreviewProps) {
  // Tiered animation classes
  const wrapperAnimation = motionTier === "cinematic"
    ? "animate-ken-burns-cinematic"
    : motionTier === "performance"
      ? "animate-ken-burns-slow"
      : ""; // basic: no zoom

  const imgAnimation = motionTier === "cinematic"
    ? "animate-avatar-breathe-slow"
    : "animate-avatar-breathe";

  const glowAnimation = motionTier === "cinematic"
    ? "animate-avatar-glow-cinematic"
    : motionTier === "performance"
      ? "animate-avatar-glow-strong"
      : "animate-avatar-glow";

  const tierLabel = motionTier === "cinematic"
    ? "Cinematic"
    : motionTier === "performance"
      ? "Performance"
      : "Live Avatar Ready";

  return (
    <div className={cn("relative overflow-hidden rounded-lg group", className)}>
      {/* Ambient glow border */}
      <div className={cn(
        "absolute inset-0 rounded-lg pointer-events-none z-10 ring-2 ring-primary/0 opacity-60",
        glowAnimation
      )} />

      {/* Ken Burns zoom + breathing float */}
      <div className={wrapperAnimation}>
        <img
          src={src}
          alt="Live Avatar"
          className={cn("w-full aspect-square object-cover", imgAnimation)}
        />
      </div>

      {/* Cinematic depth overlay */}
      {motionTier === "cinematic" && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-background/60 via-transparent to-background/20" />
      )}

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-background/40 via-transparent to-transparent" />

      {/* Live badge */}
      {showBadge && (
        <div className="absolute top-2 left-2 z-20">
          <Badge className="backdrop-blur-sm gap-1 text-[10px] bg-primary/80 text-primary-foreground">
            <Sparkles className="h-2.5 w-2.5" />
            {tierLabel}
          </Badge>
        </div>
      )}
    </div>
  );
}
