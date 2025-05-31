"use client"

import { useRef, useEffect } from 'react';

const MUSICAL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SMOOTHING_FACTOR = 0.3; // Adjust this value between 0 and 1 (0 = no smoothing, 1 = max smoothing)
const MIN_HEIGHT = 0.05; // Minimum height for very quiet notes
const STRONG_NOTE_THRESHOLD = 0.7; // Increased threshold for considering a note "strong"
const NOISE_FLOOR = 0.2; // Minimum amplitude to consider a note present

interface ChromaVectorViewProps {
  label: string;
  value: Float32Array;
  dominantNote?: number;
}

export const ChromaVectorView = ({ label, value, dominantNote }: ChromaVectorViewProps) => {
  // Keep track of smoothed values
  const smoothedValues = useRef<number[]>(new Array(12).fill(0));
  // Keep track of historical max for adaptive normalization
  const historicalMax = useRef<number>(0);
  
  useEffect(() => {
    if (!value || value.length !== 12) return;

    // Update historical max with decay
    const currentMax = Math.max(...Array.from(value));
    historicalMax.current = Math.max(
      currentMax,
      historicalMax.current * 0.95 // Slowly decay historical max
    );

    // Update smoothed values with noise floor
    for (let i = 0; i < 12; i++) {
      const normalizedValue = value[i] / (historicalMax.current || 1);
      // Apply noise floor
      const noiseGated = normalizedValue > NOISE_FLOOR ? normalizedValue : 0;
      smoothedValues.current[i] = smoothedValues.current[i] * (1 - SMOOTHING_FACTOR) + 
                                 noiseGated * SMOOTHING_FACTOR;
    }
  }, [value]);

  if (!value || value.length !== 12) {
    return (
      <div className="p-1 pl-2 relative text-xs text-white flex flex-row gap-2">
        <div className="w-30 text-yellow-500">{label}</div>
        <div className="text-white">Invalid data</div>
      </div>
    );
  }

  // Calculate average amplitude for debug info
  const avgAmplitude = smoothedValues.current.reduce((a, b) => a + b, 0) / 12;
  const maxAmplitude = Math.max(...smoothedValues.current);

  return (
    <div className="p-1 pl-2 relative text-xs text-white">
      <div className="w-30 text-yellow-500 mb-1">
        {label}
        <span className="ml-2 text-gray-400">
          (avg: {avgAmplitude.toFixed(2)}, max: {maxAmplitude.toFixed(2)})
        </span>
      </div>
      <div className="flex flex-row gap-1 h-20">
        {smoothedValues.current.map((amplitude, index) => {
          // Ensure minimum height and normalize between MIN_HEIGHT and 1
          const normalizedHeight = MIN_HEIGHT + (1 - MIN_HEIGHT) * amplitude;
          
          // Determine color based on note strength and dominance
          const isStrongNote = amplitude > STRONG_NOTE_THRESHOLD && amplitude > avgAmplitude * 1.5;
          const isDominant = index === dominantNote && dominantNote !== -1 && isStrongNote;
          
          const barColor = isDominant 
            ? 'bg-green-500/50'
            : isStrongNote 
              ? 'bg-blue-500/50' 
              : amplitude > NOISE_FLOOR
                ? 'bg-blue-500/30'
                : 'bg-gray-500/20';
          
          const textColor = isDominant
            ? 'text-green-500'
            : isStrongNote
              ? 'text-white'
              : amplitude > NOISE_FLOOR
                ? 'text-white/70'
                : 'text-gray-500/50';
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-purple-500/50 flex-grow relative"
                style={{ height: '100%' }}
              >
                <div
                  className={`absolute bottom-0 w-full ${barColor}`}
                  style={{
                    height: `${normalizedHeight * 100}%`,
                    transition: 'height 0.1s ease-out'
                  }}
                />
              </div>
              <div className={`mt-1 ${textColor}`}>
                {MUSICAL_NOTES[index]}
                <div className="text-[8px] opacity-50">{amplitude.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 