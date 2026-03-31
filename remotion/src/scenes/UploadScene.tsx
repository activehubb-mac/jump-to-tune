import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

// Feature Montage: Create → Share → Get Paid (3 beats of 90 frames each)
export const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Beat 1: CREATE (0-90)
  const createOp = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const createScale = spring({ frame: frame - 5, fps, config: { damping: 15 } });

  // Beat 2: SHARE (90-180)
  const shareOp = interpolate(frame, [90, 105, 165, 180], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shareScale = spring({ frame: frame - 95, fps, config: { damping: 15 } });

  // Beat 3: GET PAID (180-270)
  const paidOp = interpolate(frame, [180, 195, 255, 270], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paidScale = spring({ frame: frame - 185, fps, config: { damping: 15 } });

  // Gold coin animation for GET PAID
  const coinRotate = interpolate(frame, [190, 260], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)", justifyContent: "center", alignItems: "center" }}>

      {/* Beat 1: CREATE */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        opacity: createOp,
      }}>
        <div style={{
          transform: `scale(${0.7 + createScale * 0.3})`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 60,
        }}>
          {/* Small avatar with creation effect */}
          <div style={{
            width: 800, height: 800, borderRadius: "50%", overflow: "hidden",
            border: "4px solid rgba(184,166,117,0.5)",
            boxShadow: "0 0 80px rgba(184,166,117,0.2)",
          }}>
            <Img src={staticFile("images/ai-avatar.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{
            fontFamily: playfair, fontSize: 160, fontWeight: 700,
            color: "#B8A675", letterSpacing: 10,
          }}>
            CREATE.
          </div>
          <div style={{ fontSize: 48, color: "rgba(255,255,255,0.4)", letterSpacing: 6 }}>
            AI Avatar • Cover Art • Music Video
          </div>
        </div>
      </div>

      {/* Beat 2: SHARE */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        opacity: shareOp,
      }}>
        <div style={{
          transform: `scale(${0.7 + shareScale * 0.3})`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 60,
        }}>
          {/* Cover art reveal */}
          <div style={{
            width: 900, height: 900, borderRadius: 40, overflow: "hidden",
            border: "3px solid rgba(184,166,117,0.3)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}>
            <Img src={staticFile("images/cover-art.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{
            fontFamily: playfair, fontSize: 160, fontWeight: 700,
            color: "#B8A675", letterSpacing: 10,
          }}>
            SHARE.
          </div>
          <div style={{ fontSize: 48, color: "rgba(255,255,255,0.4)", letterSpacing: 6 }}>
            Distribute to All Platforms
          </div>
        </div>
      </div>

      {/* Beat 3: GET PAID */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        opacity: paidOp,
      }}>
        <div style={{
          transform: `scale(${0.7 + paidScale * 0.3})`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 60,
        }}>
          {/* Gold coin */}
          <div style={{
            width: 500, height: 500, borderRadius: "50%",
            background: "linear-gradient(135deg, #d4c894 0%, #B8A675 50%, #8a7d56 100%)",
            display: "flex", justifyContent: "center", alignItems: "center",
            boxShadow: "0 20px 60px rgba(184,166,117,0.4)",
            transform: `rotateY(${coinRotate}deg)`,
            fontSize: 200, color: "#0a0a0a", fontWeight: 700,
          }}>
            $
          </div>
          <div style={{
            fontFamily: playfair, fontSize: 140, fontWeight: 700,
            color: "#B8A675", letterSpacing: 10,
          }}>
            GET PAID.
          </div>
          <div style={{ fontSize: 48, color: "rgba(255,255,255,0.4)", letterSpacing: 6 }}>
            Earn From Your Music Empire
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
