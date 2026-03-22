import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface LiveAvatarPreviewProps {
  src: string;
  className?: string;
  showBadge?: boolean;
}

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
