import { useState, useEffect, useRef, useMemo } from "react";

import robotSinging from "@/assets/robot-pose-singing.png";
import robotDancing from "@/assets/robot-pose-dancing.png";
import robotHeadbang from "@/assets/robot-pose-headbang.png";
import robotPointing from "@/assets/robot-pose-pointing.png";

const poses = [robotSinging, robotDancing, robotHeadbang, robotPointing];

export function RobotPerformer() {
  const [poseIndex, setPoseIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const lastSection = useRef(0);
  const rafId = useRef(0);

  // Preload all images
  useMemo(() => {
    poses.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const section = Math.floor(window.scrollY / 400);
        if (section !== lastSection.current) {
          lastSection.current = section;
          // Fade out, swap, fade in
          setOpacity(0);
          setTimeout(() => {
            setPoseIndex((prev) => {
              let next: number;
              do {
                next = Math.floor(Math.random() * poses.length);
              } while (next === prev && poses.length > 1);
              return next;
            });
            setOpacity(1);
          }, 250);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return null;

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
        className="absolute inset-0 robot-glow-pulse"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          filter: "blur(30px)",
          transform: "scale(1.3)",
        }}
      />

      {/* Robot image */}
      <img
        src={poses[poseIndex]}
        alt=""
        className="absolute inset-0 w-full h-full object-contain robot-float robot-rotate"
        style={{
          opacity: opacity * 0.2,
          transition: "opacity 0.3s ease-in-out",
          filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
        }}
      />
    </div>
  );
}
