import { useState, useEffect, useMemo, useRef, useCallback } from "react";

import charRobotDj from "@/assets/char-robot-dj.png";
import charMaleSinger from "@/assets/char-male-singer.png";
import charFemaleSinger from "@/assets/char-female-singer.png";
import charBraidsSinger from "@/assets/char-braids-singer.png";
import charBlondeDj from "@/assets/char-blonde-dj.png";

const characters = [
  { src: charRobotDj, id: "robot-dj" },
  { src: charMaleSinger, id: "male-singer" },
  { src: charFemaleSinger, id: "female-singer" },
  { src: charBraidsSinger, id: "braids-singer" },
  { src: charBlondeDj, id: "blonde-dj" },
];

export function CharacterPerformer() {
  const [charIndex, setCharIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload all images
  useMemo(() => {
    characters.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // JS-driven micro-jitter: randomize CSS custom properties every 2-3s
  const updateJitter = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty("--jitter-x", `${(Math.random() - 0.5) * 6}px`);
    el.style.setProperty("--jitter-y", `${(Math.random() - 0.5) * 4}px`);
    el.style.setProperty("--jitter-r", `${(Math.random() - 0.5) * 2}deg`);
    el.style.setProperty("--breath-scale", `${1 + (Math.random() * 0.02)}`);
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Jitter interval — irregular timing via random delay
    let jitterTimer: ReturnType<typeof setTimeout>;
    const scheduleJitter = () => {
      const delay = 1800 + Math.random() * 1400; // 1.8-3.2s
      jitterTimer = setTimeout(() => {
        updateJitter();
        scheduleJitter();
      }, delay);
    };
    updateJitter();
    scheduleJitter();

    // Character swap interval
    const swapInterval = setInterval(() => {
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
      }, 400);
    }, 10000);

    return () => {
      clearInterval(swapInterval);
      clearTimeout(jitterTimer);
    };
  }, [updateJitter]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return null;

  const current = characters[charIndex];

  return (
    <div
      className="fixed pointer-events-none inset-0 flex items-center justify-center"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        className="relative w-[180px] h-[260px] md:w-[280px] md:h-[400px] char-container"
        style={{
          "--jitter-x": "0px",
          "--jitter-y": "0px",
          "--jitter-r": "0deg",
          "--breath-scale": "1",
        } as React.CSSProperties}
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

        {/* Upper body — head & torso with independent animation */}
        <div
          className="absolute inset-0 char-upper-body"
          style={{
            clipPath: "inset(0 0 40% 0)",
          }}
        >
          <img
            src={current.src}
            alt=""
            className="w-full h-full object-contain"
            style={{
              opacity: opacity * 0.22,
              transition: "opacity 0.4s ease-in-out",
              filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
            }}
          />
        </div>

        {/* Lower body — hips & legs with delayed animation */}
        <div
          className="absolute inset-0 char-lower-body"
          style={{
            clipPath: "inset(60% 0 0 0)",
          }}
        >
          <img
            src={current.src}
            alt=""
            className="w-full h-full object-contain"
            style={{
              opacity: opacity * 0.22,
              transition: "opacity 0.4s ease-in-out",
              filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
            }}
          />
        </div>

        {/* Full body base layer — main character animation */}
        <img
          src={current.src}
          alt=""
          className={`absolute inset-0 w-full h-full object-contain char-base char-${current.id}`}
          style={{
            opacity: opacity * 0.2,
            transition: "opacity 0.4s ease-in-out",
            filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
          }}
        />
      </div>
    </div>
  );
}
