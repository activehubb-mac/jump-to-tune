import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const VideoGenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  // Cascading frames
  const frames = [0, 1, 2, 3, 4];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 400,
        fontFamily: playfair, fontSize: 100, fontWeight: 700,
        color: "#B8A675", opacity: titleSpring, letterSpacing: 3,
      }}>
        Create Your Video
      </div>

      {/* Cascading video frames */}
      <div style={{ position: "relative", width: 1000, height: 1600, marginTop: 200 }}>
        {frames.map((i) => {
          const delay = 20 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          const rotation = interpolate(s, [0, 1], [15 - i * 8, -2 + i * 1]);
          const x = interpolate(s, [0, 1], [400, -80 + i * 40]);
          const y = interpolate(s, [0, 1], [300, -100 + i * 50]);
          const op = interpolate(frame, [delay, delay + 15], [0, 1 - i * 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 700, height: 1050,
                borderRadius: 30,
                overflow: "hidden",
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                opacity: op,
                border: "3px solid rgba(184,166,117,0.2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              <Img
                src={staticFile("images/cover-art.jpg")}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  filter: `hue-rotate(${i * 30}deg) brightness(${0.6 + i * 0.08})`,
                }}
              />
              {/* Overlay with frame number */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)`,
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                paddingBottom: 40,
              }}>
                <div style={{ fontSize: 36, color: "#B8A675", letterSpacing: 4 }}>
                  FRAME {String(i + 1).padStart(2, "0")}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div style={{
        position: "absolute", bottom: 500,
        display: "flex", alignItems: "center", gap: 30,
      }}>
        <div style={{
          fontSize: 36, color: "rgba(255,255,255,0.5)", letterSpacing: 3,
        }}>
          GENERATING
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 16, height: 16, borderRadius: "50%",
              background: "#B8A675",
              opacity: interpolate(
                Math.sin(frame * 0.1 + i * 1.5),
                [-1, 1], [0.2, 0.8]
              ),
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
