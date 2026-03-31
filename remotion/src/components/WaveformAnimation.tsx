import { useCurrentFrame, interpolate } from "remotion";
import React from "react";

const BAR_COUNT = 48;

export const WaveformAnimation: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 200, justifyContent: "center" }}>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const barProgress = interpolate(progress, [i / BAR_COUNT, (i + 1) / BAR_COUNT], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const baseHeight = 20 + Math.sin(i * 0.8) * 60 + Math.cos(i * 1.3) * 40;
        const animHeight = baseHeight * barProgress;
        const wave = Math.sin(frame * 0.08 + i * 0.4) * 15 * barProgress;

        return (
          <div
            key={i}
            style={{
              width: 12,
              height: Math.max(8, animHeight + wave),
              borderRadius: 6,
              background: `linear-gradient(180deg, #B8A675 0%, #8a7a52 100%)`,
              opacity: interpolate(barProgress, [0, 0.3], [0.2, 1], { extrapolateRight: "clamp" }),
              transition: "none",
            }}
          />
        );
      })}
    </div>
  );
};
