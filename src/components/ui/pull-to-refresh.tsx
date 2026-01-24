import { ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const {
    containerRef,
    pullDistance,
    pullProgress,
    isRefreshing,
    canRefresh,
  } = usePullToRefresh({ onRefresh, threshold });

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-50"
        style={{ top: -60 }}
        animate={{
          y: pullDistance,
          opacity: pullProgress > 0.1 ? 1 : 0,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary/20 backdrop-blur-sm border border-primary/30",
            canRefresh && "bg-primary/30 border-primary/50"
          )}
        >
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : pullProgress * 180,
            }}
            transition={{
              rotate: isRefreshing
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : { duration: 0.1 },
            }}
          >
            <RefreshCw
              className={cn(
                "w-5 h-5 text-primary",
                isRefreshing && "text-primary"
              )}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content with pull transform */}
      <motion.div
        animate={{
          y: pullDistance > 0 ? pullDistance : 0,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
