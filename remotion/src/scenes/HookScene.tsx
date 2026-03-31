import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gold flash burst
  const flashOp = interpolate(frame, [0, 10, 35], [0, 0.4, 0], { extrapolateRight: "clamp" });

  // Logo scale in
  const logoScale = spring({ frame: frame - 15, fps, config: { damping: 15 } });
  const logoOp = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Tagline
  const tagOp = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [50, 70], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold lines
  const lineWidth = interpolate(frame, [10, 60], [0, 800], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #141414 60%, #0a0a0a 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Gold flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.6) 0%, transparent 60%)",
        opacity: flashOp,
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 60 }}>
        {/* Gold line top */}
        <div style={{ width: lineWidth, height: 3, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />

        {/* JumTunes Logo */}
        <div style={{
          opacity: logoOp,
          transform: `scale(${0.8 + logoScale * 0.2})`,
        }}>
          <Img
            src={staticFile("images/jumtunes-logo.png")}
            style={{ width: 800, height: "auto", objectFit: "contain" }}
          />
        </div>

        {/* Tagline */}
        <div style={{
          opacity: tagOp,
          transform: `translateY(${tagY}px)`,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: playfair, fontSize: 100, fontWeight: 700,
            color: "#B8A675", letterSpacing: 3, lineHeight: 1.2,
          }}>
            Welcome to JumTunes
          </div>
        </div>

        {/* Gold line bottom */}
        <div style={{ width: lineWidth, height: 3, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};
