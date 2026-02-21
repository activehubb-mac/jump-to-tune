import { Badge } from "@/components/ui/badge";
import { Award, Star, Shield, Crown, Gem, Trophy, ShoppingBag, Zap } from "lucide-react";
import { UserBadge } from "@/hooks/useUserBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BADGE_ICONS: Record<string, React.ElementType> = {
  first_purchase: ShoppingBag,
  early_adopter: Zap,
  repeat_buyer_3: Star,
  repeat_buyer_5: Crown,
  repeat_buyer_10: Gem,
  drop_owner: Award,
  v1_holder: Trophy,
  multi_drop_3: Shield,
  multi_drop_5: Crown,
  multi_drop_10: Gem,
};

interface BadgeDisplayProps {
  badges: UserBadge[];
  compact?: boolean;
  showAll?: boolean;
}

export function BadgeDisplay({ badges, compact = false, showAll = false }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  const publicBadges = badges.filter((b) => b.is_public);
  const displayed = showAll ? publicBadges : publicBadges.slice(0, 3);

  if (displayed.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "gap-2"}`}>
        {displayed.map((badge) => {
          const Icon = BADGE_ICONS[badge.badge_key] || Award;
          const label = (badge.metadata as any)?.label || badge.badge_key.replace(/_/g, " ");
          const isGold = badge.tier === "gold";

          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`gap-1 text-xs cursor-default ${
                    isGold
                      ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                      : "border-muted-foreground/30 text-muted-foreground bg-muted/20"
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isGold ? "text-yellow-400" : "text-muted-foreground"}`} />
                  {!compact && label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {isGold ? "Platform Badge" : "Artist Badge"}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {!showAll && publicBadges.length > 3 && (
          <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">
            +{publicBadges.length - 3}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
