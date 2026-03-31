import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const CoverArtScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  // Cover art reveal - dramatic unblur
  const coverDelay = 30;
  const coverProgress = spring({ frame: frame - coverDelay, fps, config: { damping: 100 } });
  const coverBlur = interpolate(coverProgress, [0, 1], [40, 0]);
  const coverScale = spring({ frame: frame - coverDelay, fps, config: { damping: 15 } });
  const coverRotate = interpolate(coverProgress, [0, 1], [-5, 0]);

  // Glow pulse
  const glowOp = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.1, 0.3]);

  const labelOp = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 400,
        fontFamily: playfair, fontSize: 100, fontWeight: 700,
        color: "#B8A675", opacity: titleSpring, letterSpacing: 3,
      }}>
        Generate Cover Art
      </div>

      {/* Cover art */}
      <div style={{
        position: "relative", marginTop: 150,
        transform: `scale(${0.8 + coverScale * 0.2}) rotate(${coverRotate}deg)`,
      }}>
        {/* Gold glow behind */}
        <div style={{
          position: "absolute", inset: -60,
          background: "radial-gradient(circle, rgba(184,166,117,0.3) 0%, transparent 70%)",
          opacity: glowOp * coverProgress,
        }} />

        <div style={{
          width: 900, height: 900, borderRadius: 40,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(184,166,117,0.15)",
          border: "3px solid rgba(184,166,117,0.3)",
        }}>
          <Img
            src={staticFile("images/cover-art.jpg")}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: `blur(${coverBlur}px)`,
            }}
          />
        </div>
      </div>

      {/* Label */}
      <div style={{
        position: "absolute", bottom: 600,
        opacity: labelOp, textAlign: "center",
      }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: "#fff", fontFamily: playfair }}>
          Golden Hour EP
        </div>
        <div style={{ fontSize: 32, color: "#B8A675", marginTop: 10, letterSpacing: 4 }}>
          ✨ AI-GENERATED ARTWORK
        </div>
      </div>
    </AbsoluteFill>
  );
};
