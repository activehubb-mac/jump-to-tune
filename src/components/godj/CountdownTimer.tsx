import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Live Now!");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono text-primary ${className || ""}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}
