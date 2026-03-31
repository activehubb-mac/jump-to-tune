import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 15 } });
  const logoOp = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tagOp = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaOp = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 120, fps, config: { damping: 15 } });

  // Words animate in
  const words = ["Create.", "Share.", "Get Paid."];
  const wordOps = words.map((_, i) => {
    const d = 150 + i * 40;
    return interpolate(frame, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  });

  const futureOp = interpolate(frame, [300, 330], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold flash at end
  const endFlashOp = interpolate(frame, [350, 370, 420], [0, 0.2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Shimmer
  const shimmerX = interpolate(frame, [0, 420], [-100, 100]);

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
        background: `linear-gradient(110deg, transparent 30%, rgba(184,166,117,0.05) 50%, transparent 70%)`,
        transform: `translateX(${shimmerX}%)`,
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        {/* Logo */}
        <div style={{ opacity: logoOp, transform: `scale(${0.8 + logoScale * 0.2})` }}>
          <Img src={staticFile("images/jumtunes-logo.png")} style={{ height: 120, width: "auto", objectFit: "contain" }} />
        </div>

        {/* Tagline */}
        <div style={{ opacity: tagOp, fontFamily: inter, fontSize: 24, color: "rgba(255,255,255,0.5)", letterSpacing: 6, textTransform: "uppercase" }}>
          The AI Music Interaction Platform
        </div>

        {/* Create. Share. Get Paid. */}
        <div style={{ display: "flex", gap: 30, marginTop: 20 }}>
          {words.map((word, i) => (
            <div key={word} style={{
              fontFamily: playfair, fontSize: 56, fontWeight: 700,
              color: "#B8A675", opacity: wordOps[i],
            }}>
              {word}
            </div>
          ))}
        </div>

        {/* Future text */}
        <div style={{
          opacity: futureOp, marginTop: 30,
          fontFamily: inter, fontSize: 32, color: "rgba(255,255,255,0.6)",
          letterSpacing: 4,
        }}>
          The future of music starts here.
        </div>

        {/* CTA button */}
        <div style={{
          opacity: ctaOp, transform: `scale(${0.9 + ctaScale * 0.1})`,
          marginTop: 30, padding: "18px 50px", borderRadius: 12,
          background: "linear-gradient(135deg, #B8A675 0%, #d4c894 100%)",
          fontFamily: inter, fontSize: 22, fontWeight: 600, color: "#0a0a0a",
          letterSpacing: 2,
        }}>
          START FOR FREE →
        </div>
      </div>
    </AbsoluteFill>
  );
};
