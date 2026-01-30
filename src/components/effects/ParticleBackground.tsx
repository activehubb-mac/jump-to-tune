import { useMemo } from "react";

type ParticleShape = "dot" | "ring" | "line" | "glow";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  type: "primary" | "accent" | "muted";
  shape: ParticleShape;
  opacity: number;
  rotation: number;
}

export function ParticleBackground() {
  const particles = useMemo(() => {
    // Increased particle count: 25 on mobile, 50 on desktop
    const count = window.innerWidth < 768 ? 25 : 50;
    const items: Particle[] = [];
    
    const shapes: ParticleShape[] = ["dot", "dot", "dot", "ring", "line", "glow"];
    const types: Particle["type"][] = ["primary", "accent", "muted"];
    
    for (let i = 0; i < count; i++) {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      items.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: shape === "glow" ? 4 + Math.random() * 6 : 2 + Math.random() * 3,
        duration: 10 + Math.random() * 10,
        delay: Math.random() * 8,
        type: types[Math.floor(Math.random() * types.length)],
        shape,
        opacity: shape === "glow" ? 0.15 + Math.random() * 0.2 : 0.3 + Math.random() * 0.4,
        rotation: Math.random() * 360,
      });
    }
    
    return items;
  }, []);

  const getParticleStyles = (particle: Particle): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      left: particle.left,
      top: particle.top,
      animationDuration: `${particle.duration}s`,
      animationDelay: `${particle.delay}s`,
      opacity: particle.opacity,
    };

    switch (particle.shape) {
      case "dot":
        return {
          ...baseStyles,
          width: particle.size,
          height: particle.size,
          borderRadius: "50%",
        };
      case "ring":
        return {
          ...baseStyles,
          width: particle.size * 2,
          height: particle.size * 2,
          borderRadius: "50%",
          background: "transparent",
          border: "1px solid currentColor",
        };
      case "line":
        return {
          ...baseStyles,
          width: particle.size * 3,
          height: 1,
          transform: `rotate(${particle.rotation}deg)`,
          borderRadius: "1px",
        };
      case "glow":
        return {
          ...baseStyles,
          width: particle.size,
          height: particle.size,
          borderRadius: "50%",
          boxShadow: `0 0 ${particle.size * 2}px ${particle.size}px currentColor`,
          filter: "blur(1px)",
        };
      default:
        return baseStyles;
    }
  };

  const getColorClass = (type: Particle["type"]) => {
    switch (type) {
      case "primary":
        return "text-primary bg-primary";
      case "accent":
        return "text-accent bg-accent";
      case "muted":
        return "text-muted-foreground/50 bg-muted-foreground/50";
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== "undefined" 
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute particle-animate ${getColorClass(particle.type)} ${
            particle.shape === "ring" || particle.shape === "line" ? "bg-transparent" : ""
          }`}
          style={getParticleStyles(particle)}
        />
      ))}
    </div>
  );
}
