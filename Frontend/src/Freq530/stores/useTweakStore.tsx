import { create } from "zustand";
import { useSafeZustandSetter } from "../tweaks/utils";

export interface useTweakStoreState {
  connections: { [key: string]: string | null } // Maps tweak ID to audio source ID
  setConnection: (tweakId: string, sourceId: string | null) => void
  tweakValues: { [key: string]: number }
  setTweakValue: (tweakId: string, value: number) => void
}

export const useTweakStore = create<useTweakStoreState>((set) => {
  const safeSetConnection = useSafeZustandSetter((tweakId: string, sourceId: string | null) =>
    set((state) => ({
      connections: { ...state.connections, [tweakId]: sourceId },
    })), 'setConnection');
  return {
    connections: {},
    setConnection: safeSetConnection,
    tweakValues: {},
    setTweakValue: (tweakId, value) =>
      set((state) => ({
        tweakValues: { ...state.tweakValues, [tweakId]: value },
      })),
  };
})
