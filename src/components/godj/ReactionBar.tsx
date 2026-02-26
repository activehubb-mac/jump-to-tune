import { Button } from "@/components/ui/button";
import { DJ_EMOJIS, DJEmoji } from "@/hooks/useDJReactions";
import { cn } from "@/lib/utils";

interface ReactionBarProps {
  reactions: Record<string, number>;
  userReaction: DJEmoji | null;
  onReact: (emoji: DJEmoji) => void;
  disabled?: boolean;
  className?: string;
}

export function ReactionBar({ reactions, userReaction, onReact, disabled, className }: ReactionBarProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {DJ_EMOJIS.map((emoji) => {
        const count = reactions[emoji] || 0;
        const isActive = userReaction === emoji;

        return (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onReact(emoji)}
            className={cn(
              "gap-1.5 border-border/50 transition-all",
              isActive && "border-primary bg-primary/10 text-primary"
            )}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-medium">{count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
