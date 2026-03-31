import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const logoOp = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tagOp = interpolate(frame, [50, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Words animate in: Create. Share. Get Paid.
  const words = ["Create.", "Share.", "Get Paid."];
  const wordOps = words.map((_, i) => {
    const d = 120 + i * 35;
    return interpolate(frame, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  });
  const wordScales = words.map((_, i) => {
    const d = 120 + i * 35;
    return spring({ frame: frame - d, fps, config: { damping: 15 } });
  });

  const futureOp = interpolate(frame, [260, 290], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const futureY = interpolate(frame, [260, 290], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold flash at end
  const endFlashOp = interpolate(frame, [370, 400, 470], [0, 0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Real artist covers floating
  const cover1Op = interpolate(frame, [80, 110], [0, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cover2Op = interpolate(frame, [110, 140], [0, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const floatY = Math.sin(frame * 0.03) * 10;

  const shimmerX = interpolate(frame, [0, 470], [-100, 100]);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #0a0a0a 0%, #1a1510 50%, #0a0a0a 100%)",
      justifyContent: "center", alignItems: "center",
    }}>
      {/* Gold flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.4) 0%, transparent 50%)",
        opacity: endFlashOp,
      }} />

      {/* Shimmer */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(110deg, transparent 30%, rgba(184,166,117,0.04) 50%, transparent 70%)`,
        transform: `translateX(${shimmerX}%)`,
      }} />

      {/* Floating covers */}
      <div style={{
        position: "absolute", left: 100, top: 150, width: 140, height: 140,
        borderRadius: 14, overflow: "hidden", opacity: cover1Op,
        transform: `translateY(${floatY}px) rotate(-6deg)`,
        boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
      }}>
        <Img src={staticFile("images/real-cover-2.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{
        position: "absolute", right: 120, bottom: 180, width: 120, height: 120,
        borderRadius: 14, overflow: "hidden", opacity: cover2Op,
        transform: `translateY(${-floatY}px) rotate(5deg)`,
        boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
      }}>
        <Img src={staticFile("images/real-cover-1.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 2 }}>
        {/* Logo */}
        <div style={{ opacity: logoOp, transform: `scale(${0.8 + logoScale * 0.2})` }}>
          <Img src={staticFile("images/jumtunes-logo.png")} style={{ height: 110, width: "auto", objectFit: "contain" }} />
        </div>

        {/* Tagline */}
        <div style={{ opacity: tagOp, fontFamily: inter, fontSize: 22, color: "rgba(255,255,255,0.5)", letterSpacing: 6, textTransform: "uppercase" }}>
          The AI Music Interaction Platform
        </div>

        {/* Create. Share. Get Paid. */}
        <div style={{ display: "flex", gap: 28, marginTop: 20 }}>
          {words.map((word, i) => (
            <div key={word} style={{
              fontFamily: playfair, fontSize: 52, fontWeight: 700,
              color: "#B8A675", opacity: wordOps[i],
              transform: `scale(${0.85 + wordScales[i] * 0.15})`,
            }}>
              {word}
            </div>
          ))}
        </div>

        {/* Future text */}
        <div style={{
          opacity: futureOp, transform: `translateY(${futureY}px)`,
          marginTop: 24,
          fontFamily: inter, fontSize: 30, color: "rgba(255,255,255,0.55)",
          letterSpacing: 3,
        }}>
          The future of music starts here.
        </div>

        {/* URL */}
        <div style={{
          opacity: interpolate(frame, [330, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          marginTop: 20, padding: "14px 40px", borderRadius: 12,
          background: "linear-gradient(135deg, #B8A675 0%, #d4c894 100%)",
          fontFamily: inter, fontSize: 20, fontWeight: 600, color: "#0a0a0a",
          letterSpacing: 2,
        }}>
          jumtunes.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
