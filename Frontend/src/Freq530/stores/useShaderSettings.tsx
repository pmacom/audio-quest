import { create } from "zustand";
import { useSafeZustandSetter } from "../tweaks/utils";
import { ShaderSettings } from "../shaders/types";
import { TEST_SHADER } from "../shaders/test-shader";

export interface useShaderSettingsState {
  selectedShaderId: number
  shaderSettings: ShaderSettings[]
  setSelectedShaderId: (id: number) => void
  updateTweakRange: (tweakIndex: number, update: Partial<{min: number, max: number, source: string | null}>) => void
  setManualTweakValue: (tweakIndex: number, value: number) => void
}

function withManualValues(ranges: typeof TEST_SHADER.ranges) {
  return ranges.map(r => ({ ...r, manualValue: r.value })) as typeof TEST_SHADER.ranges;
}

export const useShaderSettings = create<useShaderSettingsState>((set, get) => {

  return {
    shaderSettings: [{
      id: 0,
      name: "Test Shader",
      vertexShader: TEST_SHADER.vertexShader,
      fragmentShader: TEST_SHADER.fragmentShader,
      ranges: withManualValues(TEST_SHADER.ranges)
    }],
    selectedShaderId: 0,
    setSelectedShaderId: (id: number) => set({ selectedShaderId: id }),
    updateTweakRange: (tweakIndex, update) => {
      set((state) => {
        const { selectedShaderId, shaderSettings } = state;
        const shaderIdx = shaderSettings.findIndex(s => s.id === selectedShaderId);
        if (shaderIdx === -1) return {};
        const shader = shaderSettings[shaderIdx];
        const oldTweak = shader.ranges[tweakIndex];
        let newTweak = { ...oldTweak, ...update };
        // If switching from controlled to manual, set value to midpoint
        if (oldTweak.source && update.source === null) {
          const mid = (oldTweak.min + oldTweak.max) / 2;
          newTweak = { ...newTweak, manualValue: mid, value: mid };
        }
        const newRanges = shader.ranges.map((r, i) =>
          i === tweakIndex ? newTweak : r
        ) as typeof shader.ranges;
        const newShader = { ...shader, ranges: newRanges };
        const newShaderSettings = [...shaderSettings];
        newShaderSettings[shaderIdx] = newShader;
        return { shaderSettings: newShaderSettings };
      });
    },
    setManualTweakValue: (tweakIndex, value) => {
      set((state) => {
        const { selectedShaderId, shaderSettings } = state;
        const shaderIdx = shaderSettings.findIndex(s => s.id === selectedShaderId);
        if (shaderIdx === -1) return {};
        const shader = shaderSettings[shaderIdx];
        const newRanges = shader.ranges.map((r, i) =>
          i === tweakIndex ? { ...r, manualValue: value, value } : r
        ) as typeof shader.ranges;
        const newShader = { ...shader, ranges: newRanges };
        const newShaderSettings = [...shaderSettings];
        newShaderSettings[shaderIdx] = newShader;
        return { shaderSettings: newShaderSettings };
      });
    }
  };
})

