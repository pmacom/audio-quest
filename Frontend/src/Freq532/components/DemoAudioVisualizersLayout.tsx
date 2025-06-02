import React from 'react';
import { AmplitudeVisualizer } from './AmplitudeVisualizer';
import { BeatIntensityPulsar } from './BeatIntensityPulsar';
import { FrequencyBandsDisplay } from './FrequencyBandsDisplay';
import { SpectralFluxColorShift } from './SpectralCentroidColorShift';
import { BeatPhaseAnimator } from './BeatPhaseAnimator';
import { DeformablePlane } from './DeformablePlane';
import { DeformableDisk } from './DeformableDisk';
import { DancingMountains } from './DancingMountains';

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
        segmentsX={63}
        segmentsY={47}
        maxDisplacement={3.5}
        frequencyMultiplier={2.0}
        color="deepskyblue"
        wireframe={false}
      />

      {/* New Deformable Disk with 4 quadrants */}
      <DeformableDisk 
        position={[0, -6, 0]} 
        radius={4}
        segments={128}
        maxDisplacement={2.5}
        frequencyMultiplier={4.0}
        quadrantRotation={Math.PI / 6} // 30 degree rotation between quadrants
        wireframe={false}
        useVertexColors={true}
      />

      {/* Optional wireframe disk for comparison */}
      <DeformableDisk 
        position={[8, -6, 0]} 
        radius={3}
        segments={96}
        maxDisplacement={1.5}
        frequencyMultiplier={3.0}
        quadrantRotation={Math.PI / 4} // 45 degree rotation between quadrants
        wireframe={true}
        useVertexColors={false}
        color="cyan"
      />

      {/* Dancing Mountains - positioned to the right */}
      <DancingMountains 
        position={[15, -4, 0]} 
        mountainCount={8}
        baseSize={0.8}
        maxHeight={3.0}
        spreadRadius={6}
        animationIntensity={1.5}
        wireframe={false}
      />

      {/* Optional wireframe mountains for comparison */}
      <DancingMountains 
        position={[25, -4, 0]} 
        mountainCount={6}
        baseSize={0.6}
        maxHeight={2.5}
        spreadRadius={4}
        animationIntensity={2.0}
        wireframe={true}
      />
    </group>
  );
} 