import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flashOp = interpolate(frame, [0, 10, 30], [0, 0.4, 0], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 100 } });
  const logoOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  
  const tagOp = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [55, 85], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  
  const subtitleOp = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [100, 130], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineW = interpolate(frame, [10, 80], [0, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Real artist covers floating in background
  const cover1Op = interpolate(frame, [140, 170], [0, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cover2Op = interpolate(frame, [180, 210], [0, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cover1Y = interpolate(frame, [0, 440], [0, -30]);
  const cover2Y = interpolate(frame, [0, 440], [0, -20]);

  // "Full creative ecosystem" text
  const ecoOp = interpolate(frame, [200, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ecoY = interpolate(frame, [200, 230], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "Let's take a tour" 
  const tourOp = interpolate(frame, [340, 370], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tourScale = spring({ frame: frame - 340, fps, config: { damping: 15 } });

  const gradAngle = interpolate(frame, [0, 440], [180, 210]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${gradAngle}deg, #0a0a0a 0%, #141414 35%, #1a1510 65%, #0a0a0a 100%)`,
      justifyContent: "center", alignItems: "center",
    }}>
      {/* Gold flash */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.5) 0%, transparent 50%)", opacity: flashOp }} />

      {/* Floating real cover art in background */}
      <div style={{
        position: "absolute", left: 80, top: 80, width: 200, height: 200,
        borderRadius: 16, overflow: "hidden", opacity: cover1Op,
        transform: `translateY(${cover1Y}px) rotate(-8deg)`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <Img src={staticFile("images/real-cover-1.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{
        position: "absolute", right: 100, bottom: 120, width: 180, height: 180,
        borderRadius: 16, overflow: "hidden", opacity: cover2Op,
        transform: `translateY(${cover2Y}px) rotate(6deg)`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <Img src={staticFile("images/real-cover-2.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 2 }}>
        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />

        {/* Logo */}
        <div style={{ opacity: logoOp, transform: `scale(${0.8 + logoScale * 0.2})` }}>
          <Img src={staticFile("images/jumtunes-logo.png")} style={{ height: 110, width: "auto", objectFit: "contain" }} />
        </div>

        {/* Platform Tour */}
        <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: playfair, fontSize: 60, fontWeight: 700, color: "#B8A675", letterSpacing: 2 }}>
            Platform Tour
          </div>
        </div>

        {/* Subtitle */}
        <div style={{ opacity: subtitleOp, transform: `translateY(${subtitleY}px)`, fontSize: 26, color: "rgba(255,255,255,0.5)", letterSpacing: 6, textTransform: "uppercase", fontFamily: inter }}>
          The First AI Music Interaction Platform
        </div>

        {/* Full creative ecosystem */}
        <div style={{
          opacity: ecoOp, transform: `translateY(${ecoY}px)`,
          fontFamily: inter, fontSize: 22, color: "rgba(255,255,255,0.35)",
          letterSpacing: 3, marginTop: 10,
        }}>
          Upload • Create • Earn — All in One Place
        </div>

        {/* Let's take a tour */}
        <div style={{
          opacity: tourOp, transform: `scale(${0.85 + tourScale * 0.15})`,
          marginTop: 30, padding: "16px 44px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(184,166,117,0.15) 0%, rgba(184,166,117,0.05) 100%)",
          border: "1px solid rgba(184,166,117,0.3)",
          fontFamily: playfair, fontSize: 28, fontWeight: 700, color: "#B8A675",
        }}>
          Let's Take a Tour →
        </div>

        <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #B8A675, transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};
