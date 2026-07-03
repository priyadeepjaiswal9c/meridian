import { Composition } from "remotion";
import { MeridianDemo, type DemoProps } from "./MeridianDemo";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MeridianDemo"
      component={MeridianDemo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ durationInSeconds: 45, withVoiceover: false }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(FPS, Math.round(props.durationInSeconds * FPS)),
      })}
    />
  );
};
