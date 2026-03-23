import { useMemo } from "react";
import { useLocation } from "react-router-dom";

type ParticleShape = "dot" | "glow" | "star" | "streak";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  shape: ParticleShape;
  opacity: number;
  rotation: number;
}

export function ParticleBackground() {
  const location = useLocation();
  const isGoDJ = location.pathname.startsWith("/go-dj");

  // Glowing dots + stars
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const particles = useMemo(() => {
    const count = isMobile ? 12 : 35;
    const items: Particle[] = [];
    const shapes: ParticleShape[] = ["dot", "dot", "glow", "star"];

    for (let i = 0; i < count; i++) {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      items.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: shape === "glow" ? 3 + Math.random() * 5 : shape === "star" ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
        duration: shape === "star" ? 3 + Math.random() * 4 : 8 + Math.random() * 12,
        delay: Math.random() * 10,
        shape,
        opacity: shape === "glow" ? 0.3 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4,
        rotation: Math.random() * 360,
      });
    }
    return items;
  }, []);

  // Shooting stars — small, subtle, spaced out
  const shootingStars = useMemo(() => {
    const count = window.innerWidth < 768 ? 4 : 8;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 80}%`,
      top: `${Math.random() * 60}%`,
      size: 20 + Math.random() * 40,
      duration: 3 + Math.random() * 4,
      delay: i * 3 + Math.random() * 5,
      opacity: 0.4 + Math.random() * 0.3,
      angle: -25 - Math.random() * 20,
    }));
  }, []);

  const getParticleStyles = (p: Particle): React.CSSProperties => {
    const base: React.CSSProperties = {
      left: p.left,
      top: p.top,
      animationDuration: `${p.duration}s`,
      animationDelay: `${p.delay}s`,
      opacity: p.opacity,
    };

    switch (p.shape) {
      case "dot":
        return {
          ...base, width: p.size, height: p.size, borderRadius: "50%",
          backgroundColor: "hsl(0 0% 100%)",
          boxShadow: `0 0 ${p.size * 3}px ${p.size}px hsl(0 0% 100% / 0.4)`,
        };
      case "glow":
        return {
          ...base, width: p.size, height: p.size, borderRadius: "50%",
          backgroundColor: "hsl(0 0% 100% / 0.8)",
          boxShadow: `0 0 ${p.size * 4}px ${p.size * 2}px hsl(0 0% 100% / 0.5), 0 0 ${p.size * 8}px ${p.size * 3}px hsl(220 60% 60% / 0.2)`,
          filter: "blur(0.5px)",
        };
      case "star":
        return {
          ...base, width: p.size, height: p.size,
          backgroundColor: "hsl(0 0% 100%)",
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          boxShadow: `0 0 ${p.size * 2}px hsl(0 0% 100% / 0.6)`,
        };
      default:
        return base;
    }
  };

  const getAnimClass = (shape: ParticleShape) => {
    if (shape === "star") return "star-twinkle";
    return "particle-animate";
  };

  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || isGoDJ) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1, backgroundColor: "hsl(0 0% 0%)" }}
      aria-hidden="true"
    >
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${getAnimClass(particle.shape)}`}
          style={getParticleStyles(particle)}
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((star) => (
        <div
          key={`ss-${star.id}`}
          className="absolute shooting-star-animate"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: 1,
            borderRadius: "1px",
            background: `linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.8), hsl(0 0% 100% / 0.4), transparent)`,
            boxShadow: `0 0 6px 1px hsl(0 0% 100% / 0.3)`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            opacity: star.opacity,
            transform: `rotate(${star.angle}deg)`,
          }}
        />
      ))}
    </div>
  );
}
