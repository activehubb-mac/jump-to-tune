import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { TourVideo } from "./TourVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={900}
      fps={30}
      width={2160}
      height={3840}
    />
    <Composition
      id="tour"
      component={TourVideo}
      durationInFrames={2382}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
