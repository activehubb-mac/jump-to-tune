import { Badge } from "@/components/ui/badge";
import { getTierInfo } from "@/hooks/useDJTiers";

interface DJBadgeProps {
  tier: number;
  className?: string;
}

export function DJBadge({ tier, className }: DJBadgeProps) {
  const info = getTierInfo(tier);

  if (tier <= 1) return null;

  return (
    <Badge
      variant="outline"
      className={`${info.color} border-current/30 gap-1 ${className || ""}`}
    >
      {info.badge} {info.name}
    </Badge>
  );
}
