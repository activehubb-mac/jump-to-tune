import React from "react";

interface EqualizerBarsProps {
  frame: number;
  barCount?: number;
  height?: number;
}

export const EqualizerBars: React.FC<EqualizerBarsProps> = ({ frame, barCount = 16, height = 200 }) => {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const speed = 0.12 + (i % 5) * 0.04;
    const offset = i * 1.3;
    const h = (Math.sin(frame * speed + offset) * 0.5 + 0.5) * height * (0.4 + Math.sin(frame * 0.05 + i * 0.7) * 0.3 + 0.3);
    return Math.max(h, 10);
  });

  const barWidth = 50;
  const gap = 16;
  const totalWidth = barCount * barWidth + (barCount - 1) * gap;

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "flex-end",
      height, width: "100%",
    }}>
      <div style={{
        display: "flex", alignItems: "flex-end", gap,
      }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: barWidth,
              height: h,
              borderRadius: 8,
              background: `linear-gradient(180deg, #B8A675 0%, rgba(184,166,117,0.3) 100%)`,
              opacity: 0.7 + Math.sin(frame * 0.1 + i) * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
};
