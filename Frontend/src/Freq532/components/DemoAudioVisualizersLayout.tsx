import React from 'react';
import { AmplitudeVisualizer } from './AmplitudeVisualizer';
import { BeatIntensityPulsar } from './BeatIntensityPulsar';
import { FrequencyBandsDisplay } from './FrequencyBandsDisplay';
import { SpectralFluxColorShift } from './SpectralCentroidColorShift';
import { BeatPhaseAnimator } from './BeatPhaseAnimator';
import { DeformablePlane } from './DeformablePlane';

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
      
      {/* Top row */}
      <AmplitudeVisualizer 
        position={[-8, 5, 0]} 
        baseScale={.1}
        color="orange"
      />
      
      <BeatIntensityPulsar 
        position={[-4, 5, 0]} 
        color="red"
        emissiveColor="red"
      />
      
      <SpectralFluxColorShift 
        position={[0, 5, 0]} 
        radius={0.6}
      />
      
      <BeatPhaseAnimator 
        position={[4, 5, 0]} 
        size={0.4}
        color="lightgreen"
      />

      {/* Middle row - Frequency bands display (centered) */}
      <FrequencyBandsDisplay 
        position={[-2, 2, 0]} 
        maxHeight={2}
        spacing={0.3}
      />

      {/* Bottom row - Large deformable plane */}
      <DeformablePlane 
        position={[0, -2, 0]} 
        width={12}
        height={8}
        segmentsX={31}
        segmentsY={23}
        maxDisplacement={1.5}
        color="deepskyblue"
        wireframe={false}
      />

      {/* Optional wireframe version for comparison */}
      <DeformablePlane 
        position={[0, -6, 0]} 
        width={8}
        height={6}
        segmentsX={15}
        segmentsY={11}
        maxDisplacement={1.0}
        color="cyan"
        wireframe={true}
      />
    </group>
  );
} 