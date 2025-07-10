import { Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { useFreq530 } from '../audio/store/useFreq530'
import { KernelSize, Resolution } from 'postprocessing';

export const PostProcessAudioEffects = () => {
  const amplitude = useFreq530(state => state.values.amplitude || 0);
  const low = useFreq530(state => state.values.low || 0);
  const mid = useFreq530(state => state.values.mid || 0);
  const high = useFreq530(state => state.values.high || 0);

  const { 
    baseIntensity, 
    audioIntensityMultiplier,
    baseLuminanceThreshold,
    audioLuminanceReduction,
    enableAudioReactive,
    debugBloom,
    forceBloom
  } = useControls('Audio Reactive Bloom', {
    baseIntensity: { value: 3.0, min: 0, max: 10, step: 0.1, label: 'Base Intensity' },
    audioIntensityMultiplier: { value: 5.0, min: 0, max: 15, step: 0.1, label: 'Audio Intensity Boost' },
    baseLuminanceThreshold: { value: 0.1, min: 0, max: 1, step: 0.05, label: 'Base Threshold' },
    audioLuminanceReduction: { value: 0.6, min: 0, max: 1, step: 0.05, label: 'Audio Threshold Reduction' },
    enableAudioReactive: { value: true, label: 'Enable Audio Reactive' },
    debugBloom: { value: true, label: 'Debug Bloom Values' },
    forceBloom: { value: false, label: 'Force Bloom (Test)' }
  });

  // Calculate audio-reactive bloom parameters
  const audioLevel = Math.max(amplitude, low, mid, high); // Use the highest frequency component
  
  // Dynamic intensity: base + audio boost
  const dynamicIntensity = forceBloom ? 10.0 : (enableAudioReactive 
    ? baseIntensity + (audioLevel * audioIntensityMultiplier)
    : baseIntensity);
  
  // Dynamic threshold: lower threshold when audio is loud (makes more pixels bloom)
  const dynamicThreshold = forceBloom ? 0.05 : (enableAudioReactive
    ? Math.max(0.05, baseLuminanceThreshold - (audioLevel * audioLuminanceReduction))
    : baseLuminanceThreshold);

  // Debug logging
  if (debugBloom) {
    console.log('🌟 Audio Reactive Bloom:', {
      audioLevel: audioLevel.toFixed(3),
      amplitude: amplitude.toFixed(3), 
      low: low.toFixed(3),
      mid: mid.toFixed(3),
      high: high.toFixed(3),
      dynamicIntensity: dynamicIntensity.toFixed(2),
      dynamicThreshold: dynamicThreshold.toFixed(3),
      enabled: enableAudioReactive
    });
  }

  return (
    <Bloom
      intensity={dynamicIntensity} // Now audio-reactive!
      blurPass={undefined}
      kernelSize={KernelSize.LARGE}
      luminanceThreshold={dynamicThreshold} // Now much lower and audio-reactive!
      luminanceSmoothing={0.1} // Increased for smoother transitions
      mipmapBlur={false}
      resolutionX={Resolution.AUTO_SIZE}
      resolutionY={Resolution.AUTO_SIZE}
    />
  )
}