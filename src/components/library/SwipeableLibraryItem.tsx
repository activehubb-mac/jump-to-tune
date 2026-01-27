import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Haptics, NotificationType } from "@capacitor/haptics";

const SWIPE_THRESHOLD = 100;

interface SwipeableLibraryItemProps {
  children: ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  className?: string;
}

export function SwipeableLibraryItem({
  children,
  onDelete,
  enabled = true,
  className = "",
}: SwipeableLibraryItemProps) {
  const isMobile = useIsMobile();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -50], [1, 0]);
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD, -50], [1, 0.8]);
  const background = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0],
    ["hsl(var(--destructive))", "transparent"]
  );

  const handleDragStart = () => {
    setShowHint(false);
  };

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      try {
        await Haptics.notification({ type: NotificationType.Warning });
      } catch {}
      
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 200);
    }
  };

  // Desktop: just render children with hover delete button
  if (!enabled || !isMobile) {
    return <div className={className}>{children}</div>;
  }

  if (isDeleting) {
    return (
      <motion.div
        initial={{ height: "auto", opacity: 1 }}
        animate={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <div ref={constraintsRef} className={`relative overflow-hidden ${className}`}>
      {/* Delete background */}
      <motion.div
        style={{ backgroundColor: background }}
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-xl"
      >
        <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }}>
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -SWIPE_THRESHOLD * 1.5, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative"
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
        
        {/* Swipe hint for mobile - only show initially */}
        {showHint && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/40 pointer-events-none">
            ← swipe
          </div>
        )}
      </motion.div>
    </div>
  );
}
