import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Video, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { EqualizerBars } from "../components/EqualizerBars";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const CoverArtScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns slow zoom
  const kenBurns = interpolate(frame, [0, 260], [1.0, 1.08], { extrapolateRight: "clamp" });

  // Gold light leak pulsing
  const lightPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.1, 0.35]);

  // Track title entrance
  const titleOp = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 60], [50, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Particle burst at start
  const burstOp = interpolate(frame, [0, 10, 40], [0, 0.5, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* Particle burst */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 45%, rgba(184,166,117,0.5) 0%, transparent 50%)",
        opacity: burstOp,
      }} />

      {/* Gold light leak */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 35%, rgba(184,166,117,0.25) 0%, transparent 55%)",
        opacity: lightPulse,
      }} />

      {/* Avatar video - large cinematic fill */}
      <div style={{
        position: "absolute",
        top: 200, left: 80, right: 80, bottom: 800,
        display: "flex", justifyContent: "center", alignItems: "center",
        overflow: "hidden", borderRadius: 60,
        transform: `scale(${kenBurns})`,
      }}>
        <Video
          src={staticFile("videos/avatar-performance.mp4")}
          volume={0}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
          }}
        />
      </div>

      {/* Cinematic vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)",
        pointerEvents: "none",
      }} />

      {/* Top/bottom bars for cinematic feel */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 250,
        background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 900,
        background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 100%)",
      }} />

      {/* Equalizer bars */}
      <div style={{ position: "absolute", bottom: 500, left: 0, right: 0 }}>
        <EqualizerBars frame={frame} barCount={24} height={300} />
      </div>

      {/* Track title overlay */}
      <div style={{
        position: "absolute", bottom: 850, left: 0, right: 0,
        textAlign: "center",
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
      }}>
        <div style={{
          fontFamily: playfair, fontSize: 80, fontWeight: 700,
          color: "#fff", letterSpacing: 4,
        }}>
          Midnight Empire
        </div>
        <div style={{
          fontSize: 40, color: "#B8A675", letterSpacing: 8,
          marginTop: 15, textTransform: "uppercase",
        }}>
          ♫ Now Playing
        </div>
      </div>
    </AbsoluteFill>
  );
};
