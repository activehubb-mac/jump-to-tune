import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

const AVATARS = ["avatar-flames.png", "avatar-street.png", "avatar-robot.png", "avatar-dj.png"];

export const TourClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const logoOp = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [50, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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

  const endFlashOp = interpolate(frame, [370, 400, 462], [0, 0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shimmerX = interpolate(frame, [0, 462], [-100, 100]);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #0a0a0a 0%, #1a1510 50%, #0a0a0a 100%)",
      justifyContent: "center", alignItems: "center",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(184,166,117,0.4) 0%, transparent 50%)",
        opacity: endFlashOp,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(110deg, transparent 30%, rgba(184,166,117,0.04) 50%, transparent 70%)`,
        transform: `translateX(${shimmerX}%)`,
      }} />

      {/* Floating avatar accents */}
      {AVATARS.map((av, i) => {
        const delay = 80 + i * 25;
        const op = interpolate(frame, [delay, delay + 30], [0, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const positions = [
          { left: 80, top: 120, rot: -8 },
          { left: 1650, top: 150, rot: 6 },
          { left: 120, top: 650, rot: 5 },
          { left: 1600, top: 680, rot: -5 },
        ];
        const p = positions[i];
        const floatY = Math.sin(frame * 0.025 + i) * 10;
        return (
          <div key={av} style={{
            position: "absolute", left: p.left, top: p.top,
            width: 100, height: 100, borderRadius: 16, overflow: "hidden",
            opacity: op, transform: `translateY(${floatY}px) rotate(${p.rot}deg)`,
            boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
            border: "2px solid rgba(184,166,117,0.15)",
          }}>
            <Img src={staticFile(`images/${av}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 2 }}>
        <div style={{ opacity: logoOp, transform: `scale(${0.8 + logoScale * 0.2})` }}>
          <Img src={staticFile("images/jumtunes-logo.png")} style={{ height: 110, width: "auto", objectFit: "contain" }} />
        </div>

        <div style={{ opacity: tagOp, fontFamily: inter, fontSize: 22, color: "rgba(255,255,255,0.5)", letterSpacing: 6, textTransform: "uppercase" }}>
          The AI Music Interaction Platform
        </div>

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

        <div style={{
          opacity: futureOp, transform: `translateY(${futureY}px)`,
          marginTop: 24, fontFamily: inter, fontSize: 30, color: "rgba(255,255,255,0.55)", letterSpacing: 3,
        }}>
          The future of music starts here.
        </div>

        <div style={{
          opacity: interpolate(frame, [330, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          marginTop: 20, padding: "14px 40px", borderRadius: 12,
          background: "linear-gradient(135deg, #B8A675 0%, #d4c894 100%)",
          fontFamily: inter, fontSize: 20, fontWeight: 600, color: "#0a0a0a", letterSpacing: 2,
        }}>
          jumtunes.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
