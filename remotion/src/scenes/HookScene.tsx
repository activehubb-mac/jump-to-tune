import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  const titleOp = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOp = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [20, 70], [0, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold flash
  const flashOp = interpolate(frame, [0, 15, 40], [0, 0.3, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #141414 0%, #0a0a0a 60%, #141414 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Gold flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.5) 0%, transparent 60%)",
        opacity: flashOp,
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        {/* Gold line */}
        <div style={{ width: lineWidth, height: 3, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />

        {/* Main title */}
        <div style={{
          fontFamily: playfair, fontSize: 140, fontWeight: 700, color: "#B8A675",
          opacity: titleOp, transform: `scale(${0.95 + titleScale * 0.05})`,
          textAlign: "center", lineHeight: 1.1, letterSpacing: -2,
        }}>
          Build Your{"\n"}Artist
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 52, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif",
          opacity: subtitleOp, letterSpacing: 12, textTransform: "uppercase",
        }}>
          Powered by JumTunes
        </div>

        {/* Gold line */}
        <div style={{ width: lineWidth, height: 3, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};
