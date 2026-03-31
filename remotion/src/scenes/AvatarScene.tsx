import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { PhoneFrame } from "../components/PhoneFrame";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const AvatarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const phoneOp = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Avatar reveal - unblur effect
  const avatarDelay = 50;
  const avatarProgress = spring({ frame: frame - avatarDelay, fps, config: { damping: 200 } });
  const avatarBlur = interpolate(avatarProgress, [0, 1], [30, 0]);
  const avatarScale = interpolate(avatarProgress, [0, 1], [1.15, 1]);

  // Label
  const labelOp = interpolate(frame, [90, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Scanning line effect
  const scanY = interpolate(frame, [avatarDelay, avatarDelay + 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Title
  const titleSpring = spring({ frame: frame - 20, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)", justifyContent: "center", alignItems: "center" }}>
      {/* Title at top */}
      <div style={{
        position: "absolute", top: 280,
        fontFamily: playfair, fontSize: 100, fontWeight: 700,
        color: "#B8A675", opacity: titleSpring, letterSpacing: 3,
      }}>
        Create Your Identity
      </div>

      {/* Phone with avatar */}
      <div style={{
        opacity: phoneOp,
        transform: `scale(${0.9 + phoneScale * 0.1})`,
        marginTop: 100,
      }}>
        <PhoneFrame>
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60 }}>
            {/* Avatar container */}
            <div style={{
              width: 500, height: 500, borderRadius: "50%",
              overflow: "hidden", position: "relative",
              border: "4px solid rgba(184,166,117,0.5)",
              boxShadow: "0 0 60px rgba(184,166,117,0.2)",
            }}>
              <Img
                src={staticFile("images/avatar.jpg")}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  filter: `blur(${avatarBlur}px)`,
                  transform: `scale(${avatarScale})`,
                }}
              />
              {/* Scan line */}
              {frame >= avatarDelay && frame < avatarDelay + 60 && (
                <div style={{
                  position: "absolute", left: 0, right: 0, top: `${scanY}%`,
                  height: 4, background: "linear-gradient(90deg, transparent, #B8A675, transparent)",
                  boxShadow: "0 0 20px rgba(184,166,117,0.5)",
                }} />
              )}
            </div>

            {/* Artist name label */}
            <div style={{
              marginTop: 50, opacity: labelOp, textAlign: "center",
            }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: "#fff", fontFamily: playfair }}>
                Kael Rivers
              </div>
              <div style={{ fontSize: 32, color: "#B8A675", marginTop: 10, letterSpacing: 4, textTransform: "uppercase" }}>
                Hip-Hop · Artist
              </div>
            </div>

            {/* AI generating badge */}
            <div style={{
              marginTop: 40, opacity: labelOp,
              padding: "16px 40px", borderRadius: 30,
              background: "rgba(184,166,117,0.15)",
              border: "1px solid rgba(184,166,117,0.3)",
              fontSize: 28, color: "#B8A675", letterSpacing: 2,
            }}>
              ✨ AI Generated
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
