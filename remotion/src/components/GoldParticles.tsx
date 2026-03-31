import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

const PARTICLES: Particle[] = Array.from({ length: 40 }, (_, i) => ({
  x: Math.sin(i * 2.39) * 0.5 + 0.5,
  y: Math.cos(i * 1.73) * 0.5 + 0.5,
  size: 2 + (i % 5) * 1.5,
  speed: 0.3 + (i % 7) * 0.15,
  opacity: 0.15 + (i % 4) * 0.1,
  delay: (i * 7) % 30,
}));

export const GoldParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {PARTICLES.map((p, i) => {
        const t = (frame + p.delay) * p.speed * 0.01;
        const px = (p.x + Math.sin(t * 1.3) * 0.08) * width;
        const py = (p.y + Math.cos(t * 0.9) * 0.06 - t * 0.02) * height;
        const o = interpolate(
          Math.sin(frame * 0.03 + i),
          [-1, 1],
          [p.opacity * 0.3, p.opacity]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py % height,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "#B8A675",
              opacity: o,
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px rgba(184,166,117,0.3)`,
            }}
          />
        );
      })}
    </div>
  );
};
