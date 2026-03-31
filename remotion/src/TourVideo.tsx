import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { TourIntro } from "./tour-scenes/TourIntro";
import { TourHomepage } from "./tour-scenes/TourHomepage";
import { TourGrowMyMusic } from "./tour-scenes/TourGrowMyMusic";
import { TourIdentityBuilder } from "./tour-scenes/TourIdentityBuilder";
import { TourVideoStudio } from "./tour-scenes/TourVideoStudio";
import { TourUpload } from "./tour-scenes/TourUpload";
import { TourGoDJ } from "./tour-scenes/TourGoDJ";
import { TourEarnings } from "./tour-scenes/TourEarnings";
import { TourAvatarShowcase } from "./tour-scenes/TourAvatarShowcase";
import { TourClosing } from "./tour-scenes/TourClosing";
import { TourCaptionOverlay } from "./tour-components/TourCaptionOverlay";

const T = 18;

// Narration is ~129s = 3870 frames
// 10 scenes with 9 transitions of 18 frames = 9*18 = 162 overlap
// Scene frames must sum to ~4050 + 162 = ~4212
//
// Narration timing (approximate beats from the script):
//   0–12s (0–360):       Intro — welcome, platform description, "let's take a tour"
//   12–22s (360–660):    Homepage — command center, trending, discovery
//   22–42s (660–1260):   Grow My Music — Go Viral, Build Artist, Grow Reach
//   42–56s (1260–1680):  AI Identity Builder — photo to avatar, generation modes
//   56–66s (1680–1980):  AI Video Studio — music videos, viral clips
//   66–78s (1980–2340):  Upload & Protection — Recording ID, hash
//   78–90s (2340–2700):  Go DJ — mix sessions, leaderboards, submissions
//   90–106s (2700–3180): Earnings — 85%, free trial, credits
//   106–118s (3180–3540):Avatar Showcase transition
//   118–129s (3540–3870):Closing — Create. Share. Get Paid.

export const TourVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <Audio src={staticFile("voiceover/tour-narration.mp3")} volume={1} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={390}>
          <TourIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={330}>
          <TourHomepage />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={630}>
          <TourGrowMyMusic />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={450}>
          <TourIdentityBuilder />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={330}>
          <TourVideoStudio />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={390}>
          <TourUpload />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={390}>
          <TourGoDJ />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={480}>
          <TourEarnings />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={360}>
          <TourAvatarShowcase />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={462}>
          <TourClosing />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <TourCaptionOverlay />
    </AbsoluteFill>
  );
};
