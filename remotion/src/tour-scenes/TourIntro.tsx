import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const TourIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flashOp = interpolate(frame, [0, 10, 30], [0, 0.3, 0], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame: frame - 15, fps, config: { damping: 15 } });
  const logoOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [60, 90], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOp = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [10, 80], [0, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Slow ambient gradient shift
  const gradAngle = interpolate(frame, [0, 270], [180, 200]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${gradAngle}deg, #0a0a0a 0%, #141414 40%, #1a1510 70%, #0a0a0a 100%)`,
      justifyContent: "center", alignItems: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.4) 0%, transparent 50%)", opacity: flashOp }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />

        <div style={{ opacity: logoOp, transform: `scale(${0.85 + logoScale * 0.15})` }}>
          <Img src={staticFile("images/jumtunes-logo.png")} style={{ height: 100, width: "auto", objectFit: "contain" }} />
        </div>

        <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: playfair, fontSize: 64, fontWeight: 700, color: "#B8A675", letterSpacing: 2 }}>
            Platform Tour
          </div>
        </div>

        <div style={{ opacity: subtitleOp, fontSize: 28, color: "rgba(255,255,255,0.5)", letterSpacing: 6, textTransform: "uppercase" }}>
          The AI Music Interaction Platform
        </div>

        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};
