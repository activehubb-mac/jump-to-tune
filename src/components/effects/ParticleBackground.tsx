import { useMemo } from "react";

type ParticleShape = "dot" | "ring" | "line" | "glow" | "star" | "streak";

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

interface NebulaOrb {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  color: "primary" | "accent";
}

interface FloatingCharacter {
  id: number;
  src: string;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const CHARACTERS = [
  "/images/character-robot.png",
  "/images/character-singer-male.png",
  "/images/character-singer-female1.png",
  "/images/character-singer-female2.png",
  "/images/character-dj.png",
];

const INSTRUMENTS = ["🎸", "🎹", "🎤", "🎧", "🎵", "🎶", "🎷", "🥁", "🎺", "🎻"];

export function ParticleBackground() {
  const particles = useMemo(() => {
    const count = window.innerWidth < 768 ? 25 : 50;
    const items: Particle[] = [];
    
    const shapes: ParticleShape[] = ["dot", "dot", "dot", "ring", "line", "glow", "star", "star", "streak"];
    const types: Particle["type"][] = ["primary", "accent", "muted"];
    
    for (let i = 0; i < count; i++) {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      items.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: shape === "glow" ? 4 + Math.random() * 8 : shape === "star" ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        duration: shape === "streak" ? 4 + Math.random() * 6 : shape === "star" ? 3 + Math.random() * 5 : 10 + Math.random() * 10,
        delay: Math.random() * 8,
        type: types[Math.floor(Math.random() * types.length)],
        shape,
        opacity: shape === "glow" ? 0.2 + Math.random() * 0.25 : shape === "streak" ? 0.4 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4,
        rotation: Math.random() * 360,
      });
    }
    
    return items;
  }, []);

  const nebulaOrbs = useMemo<NebulaOrb[]>(() => [
    { id: 0, left: "15%", top: "25%", size: 80, duration: 25, color: "primary" },
    { id: 1, left: "70%", top: "60%", size: 100, duration: 35, color: "accent" },
    { id: 2, left: "45%", top: "75%", size: 60, duration: 30, color: "primary" },
  ], []);

  const floatingCharacters = useMemo<FloatingCharacter[]>(() => {
    return CHARACTERS.map((src, i) => ({
      id: i,
      src,
      left: `${10 + (i * 18) + Math.random() * 10}%`,
      top: `${15 + Math.random() * 65}%`,
      size: window.innerWidth < 768 ? 28 + Math.random() * 16 : 40 + Math.random() * 24,
      duration: 18 + Math.random() * 14,
      delay: i * 2.5,
      opacity: 0.06 + Math.random() * 0.06,
    }));
  }, []);

  const floatingInstruments = useMemo(() => {
    const count = window.innerWidth < 768 ? 8 : 14;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: INSTRUMENTS[i % INSTRUMENTS.length],
      left: `${Math.random() * 95}%`,
      top: `${Math.random() * 90}%`,
      size: 12 + Math.random() * 10,
      duration: 12 + Math.random() * 16,
      delay: Math.random() * 10,
      opacity: 0.08 + Math.random() * 0.08,
      rotation: Math.random() * 360,
    }));
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
        return { ...baseStyles, width: particle.size, height: particle.size, borderRadius: "50%" };
      case "ring":
        return {
          ...baseStyles, width: particle.size * 2, height: particle.size * 2,
          borderRadius: "50%", background: "transparent", border: "1px solid currentColor",
        };
      case "line":
        return {
          ...baseStyles, width: particle.size * 3, height: 1,
          transform: `rotate(${particle.rotation}deg)`, borderRadius: "1px",
        };
      case "glow":
        return {
          ...baseStyles, width: particle.size, height: particle.size, borderRadius: "50%",
          boxShadow: `0 0 ${particle.size * 3}px ${particle.size * 1.5}px currentColor`,
          filter: "blur(1px)",
        };
      case "star":
        return {
          ...baseStyles, width: particle.size, height: particle.size,
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        };
      case "streak":
        return {
          ...baseStyles, width: particle.size * 12, height: 1,
          borderRadius: "1px",
          background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
        };
      default:
        return baseStyles;
    }
  };

  const getAnimClass = (shape: ParticleShape) => {
    if (shape === "streak") return "shooting-star-animate";
    if (shape === "star") return "star-twinkle";
    return "particle-animate";
  };

  const getColorClass = (type: Particle["type"]) => {
    switch (type) {
      case "primary": return "text-primary bg-primary";
      case "accent": return "text-accent bg-accent";
      case "muted": return "text-muted-foreground/50 bg-muted-foreground/50";
    }
  };

  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {/* SVG noise filter */}
      <svg className="absolute w-0 h-0">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      {/* Noise grain overlay */}
      <div
        className="fixed inset-0"
        style={{
          filter: "url(#noise)",
          opacity: 0.03,
          mixBlendMode: "overlay",
          zIndex: 2,
        }}
      />

      {/* Nebula orbs */}
      {nebulaOrbs.map((orb) => (
        <div
          key={`orb-${orb.id}`}
          className="absolute rounded-full nebula-orb"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, hsl(var(--${orb.color}) / 0.25), transparent 70%)`,
            filter: `blur(${orb.size / 3}px)`,
            animationDuration: `${orb.duration}s`,
          }}
        />
      ))}

      {/* Horizon light line */}
      <div
        className="fixed left-0 right-0 horizon-line"
        style={{
          top: "45%",
          height: "1px",
          background: "linear-gradient(90deg, transparent 5%, hsl(var(--primary) / 0.3) 30%, hsl(var(--accent) / 0.2) 70%, transparent 95%)",
          boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.1)",
          zIndex: 1,
        }}
      />

      {/* Floating characters - deep in background, very small & faint */}
      {floatingCharacters.map((char) => (
        <div
          key={`char-${char.id}`}
          className="absolute particle-animate"
          style={{
            left: char.left,
            top: char.top,
            width: char.size,
            height: char.size,
            animationDuration: `${char.duration}s`,
            animationDelay: `${char.delay}s`,
            opacity: char.opacity,
            filter: "blur(0.5px) grayscale(0.4)",
          }}
        >
          <img
            src={char.src}
            alt=""
            className="w-full h-full object-contain"
            style={{ opacity: 0.9 }}
            loading="lazy"
          />
        </div>
      ))}

      {/* Floating music instruments */}
      {floatingInstruments.map((inst) => (
        <div
          key={`inst-${inst.id}`}
          className="absolute particle-animate select-none"
          style={{
            left: inst.left,
            top: inst.top,
            fontSize: inst.size,
            animationDuration: `${inst.duration}s`,
            animationDelay: `${inst.delay}s`,
            opacity: inst.opacity,
            transform: `rotate(${inst.rotation}deg)`,
            filter: "blur(0.3px)",
          }}
        >
          {inst.emoji}
        </div>
      ))}

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${getAnimClass(particle.shape)} ${getColorClass(particle.type)} ${
            particle.shape === "ring" || particle.shape === "line" || particle.shape === "streak" ? "bg-transparent" : ""
          }`}
          style={getParticleStyles(particle)}
        />
      ))}
    </div>
  );
}
