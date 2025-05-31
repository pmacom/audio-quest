import { useMemo } from "react";
import { useFreq530 } from "@/Freq530/stores/useFreq530";
import DisplayRow from "./DisplayRow";
import { getDisplayConfig, BASE_AUDIO_KEYS, ENHANCED_AUDIO_KEYS, AudioDisplayKey } from "./displayConfig";

const AudioStateView = () => {
  const state = useFreq530();

  // Compose the list of keys to display, filtering out enhanced keys if their flag is off
  const displayKeys = useMemo(() => {
    const base = BASE_AUDIO_KEYS;
    const enhanced = ENHANCED_AUDIO_KEYS.filter((key) => getDisplayConfig(key));
    return [...base, ...enhanced];
  }, [state]);

  return (
    <div className="absolute top-0 left-0 w-90 h-full bg-purple z-[900] p-2 text-white">
      {displayKeys.map((key) => {
        const config = getDisplayConfig(key);
        if (!config) return null;
        let value = state[key];
        if (typeof value === 'boolean') value = value ? 1 : 0;
        if (value instanceof Float32Array) value = 0;
        if (typeof value !== 'number') value = 0;
        return (
          <DisplayRow
            key={key}
            label={config.label}
            value={value}
            labelColor={config.color}
            displayType={config.displayType}
          />
        );
      })}
    </div>
  );
};

export default AudioStateView; 