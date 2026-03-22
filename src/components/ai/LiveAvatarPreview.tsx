import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface LiveAvatarPreviewProps {
  src: string;
  className?: string;
  showBadge?: boolean;
}

export function LiveAvatarPreview({ src, className, showBadge = true }: LiveAvatarPreviewProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg group", className)}>
      {/* Ambient glow border */}
      <div className="absolute inset-0 rounded-lg pointer-events-none z-10 ring-2 ring-primary/0 animate-avatar-glow opacity-60" />

      {/* Ken Burns zoom + breathing float */}
      <div className="animate-ken-burns">
        <img
          src={src}
          alt="Live Avatar"
          className="w-full aspect-square object-cover animate-avatar-breathe"
        />
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-background/40 via-transparent to-transparent" />

      {/* Live badge */}
      {showBadge && (
        <div className="absolute top-2 left-2 z-20">
          <Badge className="backdrop-blur-sm gap-1 text-[10px] bg-primary/80 text-primary-foreground">
            <Sparkles className="h-2.5 w-2.5" />
            Live Avatar Ready
          </Badge>
        </div>
      )}
    </div>
  );
}
