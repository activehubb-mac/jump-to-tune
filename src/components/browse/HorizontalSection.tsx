import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showAll?: string;
  autoScrollInterval?: number;
}

export function HorizontalSection({
  title,
  subtitle,
  icon,
  children,
  className,
  autoScrollInterval = 5000,
}: HorizontalSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isPaused = useRef(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollToNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isPaused.current) return;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
    if (atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      // Scroll by one card width
      const firstChild = el.firstElementChild as HTMLElement | null;
      const cardWidth = firstChild ? firstChild.offsetWidth + 16 : 300;
      el.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [children]);

  // Auto-scroll timer
  useEffect(() => {
    if (!autoScrollInterval) return;
    const timer = setInterval(scrollToNext, autoScrollInterval);
    return () => clearInterval(timer);
  }, [autoScrollInterval, scrollToNext]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={cn("mb-10", className)}
      onPointerEnter={() => (isPaused.current = true)}
      onPointerLeave={() => (isPaused.current = false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {/* Desktop arrows */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              canScrollLeft
                ? "text-foreground hover:bg-card"
                : "text-muted-foreground/30 cursor-default"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              canScrollRight
                ? "text-foreground hover:bg-card"
                : "text-muted-foreground/30 cursor-default"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </section>
  );
}

/** Wrapper for each item in a HorizontalSection to ensure consistent sizing */
export function HorizontalSectionItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.33%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] snap-start">
      {children}
    </div>
  );
}
