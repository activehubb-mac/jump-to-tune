import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface SwipeableNotificationProps {
  notification: Notification;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onClick: (notification: Notification) => void;
  getIcon: (type: string) => React.ReactNode;
}

const SWIPE_THRESHOLD = 100;

export function SwipeableNotification({
  notification,
  onDelete,
  onMarkRead,
  onClick,
  getIcon,
}: SwipeableNotificationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -50], [1, 0]);
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD, -50], [1, 0.8]);
  const background = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0],
    ["hsl(var(--destructive))", "transparent"]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete(notification.id);
      }, 200);
    }
  };

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
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        style={{ backgroundColor: background }}
        className="absolute inset-0 flex items-center justify-end pr-6"
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
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative glass-card p-4 cursor-pointer transition-colors ${
          !notification.read ? "border-l-2 border-l-primary bg-primary/5" : ""
        }`}
        onClick={() => onClick(notification)}
        whileTap={{ cursor: "grabbing" }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-medium text-sm ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                {notification.title}
              </h3>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            {/* Desktop delete button - hidden on touch devices */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hidden sm:flex"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Swipe hint for mobile */}
        <div className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 pointer-events-none">
          ← swipe to delete
        </div>
      </motion.div>
    </div>
  );
}
