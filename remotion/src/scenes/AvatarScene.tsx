import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { EqualizerBars } from "../components/EqualizerBars";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const AvatarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Avatar entrance
  const avatarScale = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const avatarOp = interpolate(frame, [5, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Ken Burns zoom
  const kenBurns = interpolate(frame, [0, 180], [1.0, 1.06], { extrapolateRight: "clamp" });

  // Head bob
  const headBob = Math.sin(frame * 0.15) * 10;

  // Beat pulse
  const beatPulse = 1 + Math.sin(frame * 0.3) * 0.015;

  // Slight rotation
  const rotDrift = Math.sin(frame * 0.08) * 1.2;

  // Gold light leak
  const lightLeakOp = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.05, 0.2]);

  // Vignette
  const vignetteOp = 0.7;

  // Simulated navbar
  const navOp = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Gold light leak behind avatar */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(184,166,117,0.3) 0%, transparent 60%)",
        opacity: lightLeakOp,
      }} />

      {/* Avatar - fills most of frame */}
      <div style={{
        position: "absolute",
        top: 400, left: 0, right: 0, bottom: 600,
        display: "flex", justifyContent: "center", alignItems: "center",
        opacity: avatarOp,
      }}>
        <div style={{
          width: 1800, height: 1800, borderRadius: 60, overflow: "hidden",
          border: "4px solid rgba(184,166,117,0.3)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(184,166,117,0.1)",
          transform: `scale(${(0.9 + avatarScale * 0.1) * kenBurns * beatPulse}) translateY(${headBob}px) rotate(${rotDrift}deg)`,
        }}>
          <Img
            src={staticFile("images/ai-avatar.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Vignette overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)",
        opacity: vignetteOp,
        pointerEvents: "none",
      }} />

      {/* Simulated JumTunes navbar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 180, opacity: navOp,
        background: "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 80px",
      }}>
        <Img
          src={staticFile("images/jumtunes-logo.png")}
          style={{ height: 80, width: "auto", objectFit: "contain" }}
        />
      </div>

      {/* Equalizer at bottom */}
      <div style={{ position: "absolute", bottom: 400, left: 0, right: 0 }}>
        <EqualizerBars frame={frame} barCount={20} height={200} />
      </div>

      {/* Artist name overlay */}
      <div style={{
        position: "absolute", bottom: 650, left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 48, color: "rgba(255,255,255,0.5)", letterSpacing: 8, textTransform: "uppercase" }}>
          The First AI Music Platform
        </div>
      </div>
    </AbsoluteFill>
  );
};
