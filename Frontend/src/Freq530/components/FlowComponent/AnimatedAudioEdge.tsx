import React from "react";
import { getBezierPath, EdgeProps } from "reactflow";
import { getDisplayConfig, AUDIO_DISPLAY_CONFIG, AudioDisplayKey } from "../AudioStateView/displayConfig";
import { useFreq530 } from "@/Freq530/stores/useFreq530";
import { DisplayType } from "../AudioStateView/types";

const GLOBAL_MULTIPLIER = 2.0; // You can tweak this for overall speed

const AnimatedAudioEdge = ({ id, sourceX, sourceY, targetX, targetY, style, data }: EdgeProps): React.ReactElement => {
  const state = useFreq530();

  // Get the audio value and config for the source field
  const sourceField = data?.sourceField as string | undefined;
  const isAudioKey = sourceField && Object.prototype.hasOwnProperty.call(AUDIO_DISPLAY_CONFIG, sourceField);
  const config = isAudioKey ? getDisplayConfig(sourceField as AudioDisplayKey) : null;
  let value = isAudioKey ? state[sourceField as keyof typeof state] : 0;
  if (typeof value !== "number") value = 0;
  let speed = 0;
  if (config) {
    if (config.displayType === DisplayType.Bipolar) {
      speed = Math.abs(value) * GLOBAL_MULTIPLIER;
    } else {
      speed = value * GLOBAL_MULTIPLIER;
    }
  }
  // Clamp speed for sanity
  speed = Math.max(0, Math.min(1, speed));
  // Opacity: 0.5 (base) to 1.0 (max)
  const opacity = 0.5 + 0.5 * speed;

  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  const stroke = style?.stroke || "#22c55e";

  return (
    <g>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={style?.strokeWidth || 3}
        opacity={opacity}
      />
    </g>
  );
};

export default AnimatedAudioEdge; 