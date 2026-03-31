import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const TourUpload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenScale = interpolate(frame, [0, 360], [1.0, 1.04], { extrapolateRight: "clamp" });

  // Feature badges
  const features = [
    { icon: "🔒", text: "Recording Protection", delay: 80 },
    { icon: "🆔", text: "Unique Recording ID", delay: 130 },
    { icon: "⚡", text: "Instant Distribution", delay: 180 },
    { icon: "🎵", text: "Auto Karaoke Ready", delay: 230 },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}>
      <div style={{ position: "absolute", top: 40, left: 80, opacity: titleOp }}>
        <div style={{ fontFamily: playfair, fontSize: 42, fontWeight: 700, color: "#B8A675" }}>
          📤 Upload Music
        </div>
        <div style={{ fontFamily: inter, fontSize: 20, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: 2 }}>
          RELEASE IN SECONDS
        </div>
      </div>

      {/* Screenshot */}
      <div style={{
        position: "absolute", top: 130, left: 60, right: 60, bottom: 120,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp,
        transform: `scale(${screenScale})`,
      }}>
        <Img src={staticFile("screenshots/upload.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Feature badges at bottom */}
      <div style={{
        position: "absolute", bottom: 30, left: 60, right: 60,
        display: "flex", justifyContent: "center", gap: 20,
      }}>
        {features.map((f) => {
          const op = interpolate(frame, [f.delay, f.delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const s = spring({ frame: frame - f.delay, fps, config: { damping: 15 } });
          return (
            <div key={f.text} style={{
              opacity: op, transform: `scale(${0.9 + s * 0.1})`,
              padding: "12px 20px", borderRadius: 12,
              background: "rgba(184,166,117,0.1)", border: "1px solid rgba(184,166,117,0.25)",
              fontFamily: inter, fontSize: 15, fontWeight: 600, color: "#B8A675",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>{f.icon}</span> {f.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
