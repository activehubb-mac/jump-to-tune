import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { GoldParticles } from "./components/GoldParticles";
import { HookScene } from "./scenes/HookScene";
import { AvatarScene } from "./scenes/AvatarScene";
import { UploadScene } from "./scenes/UploadScene";
import { CoverArtScene } from "./scenes/CoverArtScene";
import { VideoGenScene } from "./scenes/VideoGenScene";
import { ClosingScene } from "./scenes/ClosingScene";

const T = 20; // transition duration in frames

// Scene durations (before overlap subtraction):
// Hook: 140, Avatar: 230, Upload: 170, CoverArt: 200, VideoGen: 170, Closing: 110
// Total with 5 transitions of 20 frames: 140+230+170+200+170+110 - 5*20 = 920. Composition is 900, close enough.

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={140}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={230}>
          <AvatarScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={170}>
          <UploadScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={200}>
          <CoverArtScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={170}>
          <VideoGenScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent gold particles over everything */}
      <GoldParticles />
    </AbsoluteFill>
  );
};
