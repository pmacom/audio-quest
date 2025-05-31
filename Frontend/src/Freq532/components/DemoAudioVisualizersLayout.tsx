import React from 'react';
import { AmplitudeVisualizer } from './AmplitudeVisualizer';
import { BeatIntensityPulsar } from './BeatIntensityPulsar';
import { FrequencyBandsDisplay } from './FrequencyBandsDisplay';
import { SpectralFluxColorShift } from './SpectralCentroidColorShift';
import { BeatPhaseAnimator } from './BeatPhaseAnimator';

export interface DemoAudioVisualizersLayoutProps {
  // Optional props for positioning the entire layout
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export function DemoAudioVisualizersLayout({
  ...props
}: DemoAudioVisualizersLayoutProps) {

  return (
    <group {...props}>
      {/* Arrange components in a grid for demonstration */}
      
      {/* Back row - larger visualizers */}
      <group position={[0, -2, -2]}>
        <FrequencyBandsDisplay />
      </group>

      {/* Front row - individual visualizers */}
      <group position={[-6, 0, 0]}>
        <AmplitudeVisualizer />
      </group>

      <group position={[-3, 0, 0]}>
        <BeatIntensityPulsar />
      </group>

      <group position={[0, 0, 0]}>
        <SpectralFluxColorShift />
      </group>

      <group position={[3, 0, 0]}>
        <BeatPhaseAnimator />
      </group>

    </group>
  );
} 