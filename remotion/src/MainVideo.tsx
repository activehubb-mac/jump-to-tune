import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { GoldParticles } from "./components/GoldParticles";
import { CaptionOverlay } from "./components/CaptionOverlay";
import { HookScene } from "./scenes/HookScene";
import { AvatarScene } from "./scenes/AvatarScene";
import { UploadScene } from "./scenes/UploadScene";
import { CoverArtScene } from "./scenes/CoverArtScene";
import { ClosingScene } from "./scenes/ClosingScene";

const T = 20; // transition duration

// 5 scenes: Hook(100) + Avatar(200) + Montage(290) + Performance(260) + Closing(130)
// Total: 980 - 4*20 = 900 frames

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={200}>
          <AvatarScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={290}>
          <UploadScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={260}>
          <CoverArtScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent layers */}
      <GoldParticles />
      <CaptionOverlay />
    </AbsoluteFill>
  );
};
