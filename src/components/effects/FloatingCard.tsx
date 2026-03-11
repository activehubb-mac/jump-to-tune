import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  depth?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function FloatingCard({
  children,
  className,
  glowColor = "hsl(var(--primary) / 0.15)",
  depth = "md",
  onClick,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const depthShadow = {
    sm: "0 4px 20px -4px",
    md: "0 8px 40px -8px",
    lg: "0 16px 60px -12px",
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      setTransform(
        `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(12px)`
      );
      setGlowStyle({
        boxShadow: `${depthShadow[depth]} ${glowColor}, 0 0 30px -10px ${glowColor}`,
      });
    },
    [depth, glowColor]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("");
    setGlowStyle({});
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "transition-all duration-300 ease-out will-change-transform",
        className
      )}
      style={{
        transform: transform || "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)",
        ...glowStyle,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
