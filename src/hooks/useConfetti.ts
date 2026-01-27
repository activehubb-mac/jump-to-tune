import { useCallback } from "react";

interface ConfettiOptions {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  colors?: string[];
  origin?: { x?: number; y?: number };
  zIndex?: number;
  particleCount?: number;
}

export function useConfetti() {
  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      
      // Fire multiple bursts for celebratory effect
      const count = 200;
      const defaults: ConfettiOptions = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: ConfettiOptions) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      // Purple and pink theme matching JumTunes
      const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#a855f7"];

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors,
      });

      fire(0.2, {
        spread: 60,
        colors,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors,
      });
    } catch (error) {
      console.error("Failed to load confetti:", error);
    }
  }, []);

  return { fireConfetti };
}
