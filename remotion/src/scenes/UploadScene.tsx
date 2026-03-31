import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { WaveformAnimation } from "../components/WaveformAnimation";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const waveProgress = interpolate(frame, [20, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const trackInfoOp = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const trackInfoY = interpolate(frame, [60, 90], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Progress bar
  const progressWidth = interpolate(frame, [30, 130], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 500,
        fontFamily: playfair, fontSize: 100, fontWeight: 700,
        color: "#B8A675", opacity: titleSpring, letterSpacing: 3,
      }}>
        Upload Your Music
      </div>

      {/* Center content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 80, marginTop: 200 }}>
        {/* Waveform */}
        <div style={{ width: 1400 }}>
          <WaveformAnimation progress={waveProgress} />
        </div>

        {/* Progress bar */}
        <div style={{ width: 1200, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            width: `${progressWidth}%`, height: "100%",
            background: "linear-gradient(90deg, #B8A675, #d4c894)",
            borderRadius: 4,
          }} />
        </div>

        {/* Track info */}
        <div style={{
          opacity: trackInfoOp,
          transform: `translateY(${trackInfoY}px)`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#fff", fontFamily: playfair }}>
            Golden Hour
          </div>
          <div style={{ fontSize: 38, color: "rgba(255,255,255,0.5)", marginTop: 15, letterSpacing: 4 }}>
            Kael Rivers · 3:42
          </div>
        </div>

        {/* Upload complete badge */}
        {frame > 110 && (
          <div style={{
            padding: "20px 50px", borderRadius: 40,
            background: "rgba(184,166,117,0.15)",
            border: "1px solid rgba(184,166,117,0.3)",
            fontSize: 32, color: "#B8A675", letterSpacing: 3,
            opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            ✓ UPLOAD COMPLETE
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
