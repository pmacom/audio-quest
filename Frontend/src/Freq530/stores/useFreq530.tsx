import { create } from "zustand";
import protobuf from "protobufjs";

export interface PrimaryFreq530State {
  time: number;
  adjustedTime: number;
  sin: number;
  cos: number;
  sinNormal: number;
  cosNormal: number;
  adjustedSin: number;
  adjustedCos: number;
  adjustedSinNormal: number;
  adjustedCosNormal: number;
  low: number;
  mid: number;
  high: number;
  kick: number;
  snare: number;
  hihat: number;
  vocalLikelihood: number;
  amplitude: number;
  rawAmplitude: number;
  beatIntensity: number;
  bps: number;
  
  lowDynamic: number;
  midDynamic: number;
  highDynamic: number;
  kickDynamic: number;
  snareDynamic: number;
  hihatDynamic: number;
  amplitudeDynamic: number;
  rawAmplitudeDynamic: number;
}

export type ConnectionState = "idle" | "connecting" | "connected" | "error";

export interface Freq530Store extends PrimaryFreq530State {
  connectionState: ConnectionState;
  connectWebSocket: () => void;
}

const initialState: PrimaryFreq530State = {
  time: 0,
  adjustedTime: 0,
  sin: 0,
  cos: 0,
  sinNormal: 0,
  cosNormal: 0,
  adjustedSin: 0,
  adjustedCos: 0,
  adjustedSinNormal: 0,
  adjustedCosNormal: 0,
  low: 0,
  mid: 0,
  high: 0,
  kick: 0,
  snare: 0,
  hihat: 0,
  vocalLikelihood: 0,
  amplitude: 0,
  rawAmplitude: 0,
  beatIntensity: 0,
  bps: 0,

  lowDynamic: 0,
  midDynamic: 0,
  highDynamic: 0,
  kickDynamic: 0,
  snareDynamic: 0,
  hihatDynamic: 0,
  amplitudeDynamic: 0,
  rawAmplitudeDynamic: 0,
};

export const useFreq530 = create<Freq530Store>((set, get) => ({
  ...initialState,
  connectionState: "idle",
  connectWebSocket: () => {
    if (get().connectionState === "connecting" || get().connectionState === "connected") return;
    set({ connectionState: "connecting" });
    protobuf.load("/state.proto", (err, root) => {
      if (err || !root) {
        set({ connectionState: "error" });
        return;
      }
      const ProtoType = root.lookupType("PrimaryFreq530State");
      const ws = new WebSocket("ws://127.0.0.1:8765");
      ws.binaryType = "arraybuffer";
      ws.onopen = () => set({ connectionState: "connected" });
      ws.onerror = () => set({ connectionState: "error" });
      ws.onclose = () => set({ connectionState: "idle" });
      ws.onmessage = (event) => {
        try {
          const msg = ProtoType.decode(new Uint8Array(event.data));
          // Convert to plain object and update store
          const obj = ProtoType.toObject(msg, { defaults: true });
          // console.log(obj);
          set({ ...obj });
        } catch (e) {
          // Optionally set error state
        }
      };
    });
  },
}));