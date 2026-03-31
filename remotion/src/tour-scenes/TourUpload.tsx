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
  const screenOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenScale = interpolate(frame, [0, 390], [1.0, 1.04], { extrapolateRight: "clamp" });

  const fileY = interpolate(frame, [50, 90], [-80, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fileOp = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fileLand = spring({ frame: frame - 80, fps, config: { damping: 12 } });

  const features = [
    { icon: "🔒", text: "Recording Protection", sub: "Timestamp & hash verification", delay: 100 },
    { icon: "🆔", text: "Unique Recording ID", sub: "JT-2025-XXXXXX format", delay: 150 },
    { icon: "⚡", text: "Instant Release", sub: "Live on platform in seconds", delay: 200 },
  ];

  // Recording ID animation
  const ridOp = interpolate(frame, [260, 285], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ridScale = spring({ frame: frame - 260, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}>
      <div style={{ position: "absolute", top: 32, left: 70, opacity: titleOp }}>
        <div style={{ fontFamily: playfair, fontSize: 40, fontWeight: 700, color: "#B8A675" }}>Upload Music</div>
        <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 2 }}>
          RELEASE IN SECONDS • PROTECTED FOREVER
        </div>
      </div>

      <div style={{
        position: "absolute", top: 120, left: 50, width: "55%", bottom: 30,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp, transform: `scale(${screenScale})`,
      }}>
        <Img src={staticFile("screenshots/upload.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", top: "40%", left: "50%",
          transform: `translate(-50%, ${fileY}px) scale(${0.9 + fileLand * 0.1})`,
          opacity: fileOp,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 16,
            background: "rgba(184,166,117,0.15)",
            border: "2px dashed rgba(184,166,117,0.5)",
            display: "flex", justifyContent: "center", alignItems: "center", fontSize: 40,
          }}>🎵</div>
        </div>
      </div>

      <div style={{ position: "absolute", right: 50, top: 160, width: 380, display: "flex", flexDirection: "column", gap: 18 }}>
        {features.map((f) => {
          const op = interpolate(frame, [f.delay, f.delay + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame, [f.delay, f.delay + 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={f.text} style={{
              opacity: op, transform: `translateX(${x}px)`,
              padding: "18px 22px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(18,18,18,0.95) 100%)",
              border: "1px solid rgba(184,166,117,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <span style={{ fontSize: 32 }}>{f.icon}</span>
              <div>
                <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 600, color: "#fff" }}>{f.text}</div>
                <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{f.sub}</div>
              </div>
            </div>
          );
        })}

        {/* Recording ID showcase */}
        <div style={{
          opacity: ridOp, transform: `scale(${0.9 + ridScale * 0.1})`,
          padding: "20px 24px", borderRadius: 16,
          background: "linear-gradient(135deg, rgba(184,166,117,0.1) 0%, rgba(20,20,20,0.95) 100%)",
          border: "2px solid rgba(184,166,117,0.3)",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: inter, fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 8 }}>
            YOUR RECORDING ID
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#B8A675", letterSpacing: 3 }}>
            JT-2025-000042
          </div>
          <div style={{ fontFamily: inter, fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
            Protected ✓ • Timestamped ✓ • Hash Verified ✓
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
