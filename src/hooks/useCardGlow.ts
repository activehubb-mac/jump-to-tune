import { useMemo } from "react";

const GLOW_CLASSES = [
  "card-glow-red",
  "card-glow-blue",
  "card-glow-yellow",
  "card-glow-orange",
  "card-glow-white",
  "card-glow-black",
] as const;

/** Returns a stable random glow class for a given card id/index */
export function useCardGlow(id: string | number): string {
  return useMemo(() => {
    const hash = typeof id === "number"
      ? id
      : id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return GLOW_CLASSES[hash % GLOW_CLASSES.length];
  }, [id]);
}
