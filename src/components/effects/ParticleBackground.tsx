import { useMemo } from "react";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  type: "primary" | "accent" | "muted";
  opacity: number;
}

export function ParticleBackground() {
  const particles = useMemo(() => {
    // Optimized count: 18 on mobile, 35 on desktop (lightweight but visible)
    const count = window.innerWidth < 768 ? 18 : 35;
    const items: Particle[] = [];
    
    const types: Particle["type"][] = ["primary", "accent", "muted"];
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 2.5,
        duration: 12 + Math.random() * 8, // Slower = less repaints
        delay: Math.random() * 6,
        type: types[Math.floor(Math.random() * types.length)],
        opacity: 0.2 + Math.random() * 0.35,
      });
    }
    
    return items;
  }, []);

  const getColorClass = (type: Particle["type"]) => {
    switch (type) {
      case "primary":
        return "bg-primary";
      case "accent":
        return "bg-accent";
      case "muted":
        return "bg-muted-foreground/40";
    }
  };

  // Check for reduced motion preference
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
          className={`absolute rounded-full particle-animate ${getColorClass(particle.type)}`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            willChange: "transform, opacity", // GPU hint
          }}
        />
      ))}
    </div>
  );
}
