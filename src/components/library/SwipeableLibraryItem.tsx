import { useState, useRef, TouchEvent } from "react";
import { Trash2, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { LibraryItem } from "@/hooks/useLibraryItems";
import { LibraryListItem } from "./LibraryListItem";

interface SwipeableLibraryItemProps {
  item: LibraryItem;
  onDelete?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  canDelete?: boolean;
  canPin?: boolean;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableLibraryItem({
  item,
  onDelete,
  onTogglePin,
  isPinned = false,
  canDelete = false,
  canPin = true,
}: SwipeableLibraryItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = false;
    setIsAnimating(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;
    currentXRef.current = currentX;

    // Only allow left swipe (negative translate)
    if (diff > 10) {
      isDraggingRef.current = true;
      const newTranslate = Math.max(-SWIPE_THRESHOLD * 2, -diff);
      setTranslateX(newTranslate);
    } else if (diff < -10 && translateX < 0) {
      // Allow swipe back right
      isDraggingRef.current = true;
      setTranslateX(Math.min(0, translateX - diff));
    }
  };

  const handleTouchEnd = () => {
    setIsAnimating(true);
    
    if (translateX < -SWIPE_THRESHOLD) {
      // Show actions
      setTranslateX(-SWIPE_THRESHOLD * 1.5);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleAction = (action: "delete" | "pin") => {
    setIsAnimating(true);
    setTranslateX(0);
    
    if (action === "delete" && onDelete) {
      onDelete();
    } else if (action === "pin" && onTogglePin) {
      onTogglePin();
    }
  };

  const resetSwipe = () => {
    setIsAnimating(true);
    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {canPin && (
          <button
            onClick={() => handleAction("pin")}
            className={cn(
              "w-16 flex items-center justify-center transition-colors",
              isPinned 
                ? "bg-muted hover:bg-muted/80" 
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isPinned ? (
              <PinOff className="w-5 h-5 text-foreground" />
            ) : (
              <Pin className="w-5 h-5 text-primary-foreground" />
            )}
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={() => handleAction("delete")}
            className="w-16 flex items-center justify-center bg-destructive hover:bg-destructive/90"
          >
            <Trash2 className="w-5 h-5 text-destructive-foreground" />
          </button>
        )}
      </div>

      {/* Main content (swipeable) */}
      <div
        className={cn(
          "relative",
          isAnimating && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={translateX < 0 ? resetSwipe : undefined}
      >
        <LibraryListItem item={item} />
      </div>
    </div>
  );
}
