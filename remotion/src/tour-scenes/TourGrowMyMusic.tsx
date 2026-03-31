import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import React from "react";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

// Three real hub sections with actual tools
const SECTIONS = [
  {
    tab: "Go Viral",
    tools: [
      { icon: "🎬", name: "Video Studio", cost: "10 credits", desc: "AI music videos with your avatar" },
      { icon: "📱", name: "Viral Generator", cost: "5 credits", desc: "Short-form promo clips for TikTok & Reels" },
    ],
  },
  {
    tab: "Build Your Artist",
    tools: [
      { icon: "🧑‍🎤", name: "Identity Builder", cost: "10-25 cr", desc: "Create your AI artist avatar & persona" },
      { icon: "🎨", name: "Cover Art", cost: "5 credits", desc: "AI-generated album artwork" },
      { icon: "💿", name: "Artist Drop", cost: "Free", desc: "Limited edition merch & digital drops" },
      { icon: "📦", name: "Release Builder", cost: "Free", desc: "Bundle albums & singles for release" },
    ],
  },
  {
    tab: "Grow Your Reach",
    tools: [
      { icon: "📋", name: "Playlist Builder", cost: "Free", desc: "Curate & share playlists to grow fans" },
    ],
  },
];

export const TourGrowMyMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Phase 1 (0–100): Hub overview with screenshot
  const screenOp = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const screenScale = interpolate(frame, [0, 380], [1.0, 1.05], { extrapolateRight: "clamp" });

  // Phase 2 (80–200): Go Viral section
  // Phase 3 (200–300): Build Your Artist section
  // Phase 4 (300–380): Grow Your Reach section

  // Active tab indicator
  const activeSection = frame < 140 ? 0 : frame < 260 ? 1 : 2;

  // Tab animations
  const tabStartFrame = 60;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)" }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 32, left: 70,
        opacity: titleOp,
      }}>
        <div style={{ fontFamily: playfair, fontSize: 38, fontWeight: 700, color: "#B8A675" }}>
          ✨ Grow My Music
        </div>
        <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 2 }}>
          AI-POWERED CREATIVE TOOLS HUB
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        position: "absolute", top: 100, left: 70, right: 70,
        display: "flex", gap: 12,
        opacity: interpolate(frame, [tabStartFrame, tabStartFrame + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {SECTIONS.map((s, i) => {
          const isActive = activeSection === i;
          const tabOp = interpolate(frame, [tabStartFrame + i * 10, tabStartFrame + i * 10 + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={s.tab} style={{
              opacity: tabOp,
              padding: "10px 24px", borderRadius: 10,
              background: isActive ? "rgba(184,166,117,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isActive ? "rgba(184,166,117,0.5)" : "rgba(255,255,255,0.08)"}`,
              fontFamily: inter, fontSize: 15, fontWeight: 600,
              color: isActive ? "#B8A675" : "rgba(255,255,255,0.35)",
              transition: "none",
            }}>
              {s.tab}
            </div>
          );
        })}
      </div>

      {/* Screenshot on left */}
      <div style={{
        position: "absolute", top: 150, left: 50, width: "48%", bottom: 30,
        borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(184,166,117,0.15)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        opacity: screenOp,
        transform: `scale(${screenScale})`,
      }}>
        <Img src={staticFile("screenshots/ai-tools.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Tool cards on right — show active section's tools */}
      <div style={{
        position: "absolute", right: 50, top: 155, width: 420,
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {SECTIONS[activeSection].tools.map((tool, i) => {
          const sectionBaseFrame = activeSection === 0 ? 80 : activeSection === 1 ? 200 : 300;
          const delay = sectionBaseFrame + i * 30;
          const cardOp = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const cardX = interpolate(frame, [delay, delay + 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={tool.name} style={{
              opacity: cardOp,
              transform: `translateX(${cardX}px)`,
              padding: "16px 20px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(18,18,18,0.95) 100%)",
              border: "1px solid rgba(184,166,117,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 32, width: 44, textAlign: "center" }}>{tool.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 600, color: "#fff" }}>{tool.name}</div>
                  <div style={{
                    fontFamily: inter, fontSize: 12, fontWeight: 600, color: "#B8A675",
                    padding: "3px 10px", borderRadius: 6,
                    background: "rgba(184,166,117,0.1)",
                  }}>
                    {tool.cost}
                  </div>
                </div>
                <div style={{ fontFamily: inter, fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{tool.desc}</div>
              </div>
            </div>
          );
        })}

        {/* Active identity banner for "Build Your Artist" phase */}
        {activeSection === 1 && (
          <div style={{
            opacity: interpolate(frame, [250, 270], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            marginTop: 8, padding: "14px 18px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(184,166,117,0.1) 0%, rgba(20,20,20,0.95) 100%)",
            border: "1px solid rgba(184,166,117,0.3)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(184,166,117,0.4)" }}>
              <Img src={staticFile("images/real-artist-1.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontFamily: inter, fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>ACTIVE IDENTITY</div>
              <div style={{ fontFamily: inter, fontSize: 15, fontWeight: 600, color: "#B8A675" }}>DFG Prodigy</div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
