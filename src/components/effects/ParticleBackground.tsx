import { useMemo } from "react";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  type: "gold" | "copper";
}

export function ParticleBackground() {
  const particles = useMemo(() => {
    const count = window.innerWidth < 768 ? 15 : 30;
    const items: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 2,
        duration: 8 + Math.random() * 7,
        delay: Math.random() * 5,
        type: Math.random() > 0.5 ? "gold" : "copper",
      });
    }
    
    return items;
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full particle-animate ${
            particle.type === "gold" ? "bg-primary" : "bg-accent"
          }`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
