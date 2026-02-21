import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Props {
  scheduledAt: string;
}

export function ScheduledReleaseBadge({ scheduledAt }: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Released!");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  const isReleased = new Date(scheduledAt).getTime() <= Date.now();

  if (isReleased) return null;

  return (
    <Badge className="bg-amber-500/90 text-white text-xs flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {timeLeft}
    </Badge>
  );
}
