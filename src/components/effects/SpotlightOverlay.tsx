import { useEffect, useRef, memo, useCallback } from "react";

interface SpotlightOverlayProps {
  /** Size of the spotlight glow in pixels */
  size?: number;
  /** Opacity of the spotlight (0-1) */
  opacity?: number;
  /** Primary color for the glow */
  color?: string;
  className?: string;
}

function SpotlightOverlayComponent({
  size = 400,
  opacity = 0.15,
  color = "139, 92, 246", // Primary purple RGB
  className = "",
}: SpotlightOverlayProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    // Smooth lerp towards mouse position
    const lerp = 0.1;
    currentPos.current.x += (mousePos.current.x - currentPos.current.x) * lerp;
    currentPos.current.y += (mousePos.current.y - currentPos.current.y) * lerp;

    if (spotlightRef.current) {
      spotlightRef.current.style.transform = `translate(${currentPos.current.x - size / 2}px, ${currentPos.current.y - size / 2}px)`;
    }

    rafRef.current = requestAnimationFrame(updatePosition);
  }, [size]);

  useEffect(() => {
    // Check for touch device or reduced motion preference
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isTouchDevice || prefersReducedMotion) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = "0";
      }
    };

    const handleMouseEnter = () => {
      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    document.body.addEventListener("mouseenter", handleMouseEnter);

    // Start animation loop
    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updatePosition]);

  // Don't render on touch devices (SSR-safe check happens in useEffect)
  return (
    <div
      ref={spotlightRef}
      className={`fixed pointer-events-none z-[1] transition-opacity duration-300 hidden md:block ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(${color}, ${opacity}) 0%, rgba(${color}, ${opacity * 0.5}) 30%, transparent 70%)`,
        borderRadius: "50%",
        top: 0,
        left: 0,
        willChange: "transform",
      }}
    />
  );
}

export const SpotlightOverlay = memo(SpotlightOverlayComponent);
