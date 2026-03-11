import { useState, useEffect, useMemo } from "react";

import charRobotDj from "@/assets/char-robot-dj.png";
import charMaleSinger from "@/assets/char-male-singer.png";
import charFemaleSinger from "@/assets/char-female-singer.png";
import charBraidsSinger from "@/assets/char-braids-singer.png";
import charBlondeDj from "@/assets/char-blonde-dj.png";

const characters = [
  { src: charRobotDj, animClass: "char-headbob" },
  { src: charMaleSinger, animClass: "char-sway" },
  { src: charFemaleSinger, animClass: "char-lean" },
  { src: charBraidsSinger, animClass: "char-bounce" },
  { src: charBlondeDj, animClass: "char-rock" },
];

export function CharacterPerformer() {
  const [charIndex, setCharIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  // Preload all images
  useMemo(() => {
    characters.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCharIndex((prev) => {
          let next: number;
          do {
            next = Math.floor(Math.random() * characters.length);
          } while (next === prev);
          return next;
        });
        setOpacity(1);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return null;

  const current = characters[charIndex];

  return (
    <div
      className="fixed pointer-events-none hidden md:block"
      style={{
        zIndex: 2,
        right: "3%",
        bottom: "8%",
        width: "280px",
        height: "400px",
      }}
      aria-hidden="true"
    >
      {/* Glow aura */}
      <div
        className="absolute inset-0 performer-glow-pulse"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          filter: "blur(30px)",
          transform: "scale(1.3)",
        }}
      />

      {/* Character image */}
      <img
        src={current.src}
        alt=""
        className={`absolute inset-0 w-full h-full object-contain ${current.animClass}`}
        style={{
          opacity: opacity * 0.2,
          transition: "opacity 0.3s ease-in-out",
          filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
        }}
      />
    </div>
  );
}
