import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CONSTANTS } from "../constants";
import { useAudioStreamStore } from "../stores/useAudioSourceStore";
import { useFreq530 } from "../stores/useFreq530";

interface AudioAnalyserData {
  isAnalyserReady: boolean;
  analyserNode: AnalyserNode | null;
}

export const FrameUpdater = () => {
  const update = useFreq530((state) => state.update);
  const isProcessingRef = useRef(false);
  const frameSkipRef = useRef(0);
  const analyserRef = useRef<AudioAnalyserData>({
    isAnalyserReady: false,
    analyserNode: null
  });

  useEffect(() => {
    const { isAnalyserReady, analyserNode } = useAudioStreamStore.getState();
    analyserRef.current = { isAnalyserReady, analyserNode };

    const unsubscribe = useAudioStreamStore.subscribe((state) => {
      analyserRef.current = { isAnalyserReady: state.isAnalyserReady, analyserNode: state.analyserNode };
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!CONSTANTS.UPDATE_ZUSTAND_EVERY_FRAME) {
      let intervalId: NodeJS.Timeout | null = setInterval(() => {
        const { isAnalyserReady, analyserNode } = analyserRef.current;
        if (!isAnalyserReady || !analyserNode) return;
        const safeFreqData = new Float32Array(analyserNode.frequencyBinCount);
        analyserNode.getFloatFrequencyData(safeFreqData);
        update(0, safeFreqData); // deltaTime is 0 for interval updates
      }, CONSTANTS.ZUSTAND_UPDATE_INTERVAL_MS);
      return () => { if (intervalId) clearInterval(intervalId); };
    }
  }, [update]);

  useFrame((_, deltaTime) => {
    if (!CONSTANTS.UPDATE_ZUSTAND_EVERY_FRAME) return;
    const { isAnalyserReady, analyserNode } = analyserRef.current;
    if (!isAnalyserReady || !analyserNode) {
      if (CONSTANTS.DEBUG.LOG_BEAT_DETECTION) {
        console.log('Analyzer not ready:', { isAnalyserReady, hasAnalyser: !!analyserNode });
      }
      return;
    }

    const safeFreqData = new Float32Array(analyserNode.frequencyBinCount);
    analyserNode.getFloatFrequencyData(safeFreqData);

    if (CONSTANTS.DEBUG.LOG_FFT_RANGE) {
      const min = Math.min(...safeFreqData);
      const max = Math.max(...safeFreqData);
      if (max > -Infinity) {  // Only log when we have real data
        console.log('Raw FFT data range:', {
          min,
          max,
          span: max - min,
          binCount: safeFreqData.length
        });
      }
    }

    if (isProcessingRef.current) return;

    if (CONSTANTS.ENABLE_FRAME_SKIP) {
      if (frameSkipRef.current++ % CONSTANTS.FRAME_SKIP_COUNT !== 0) {
        return;
      }
    }

    isProcessingRef.current = true;
    update(deltaTime, safeFreqData);
    isProcessingRef.current = false;
  });

  return null;
}