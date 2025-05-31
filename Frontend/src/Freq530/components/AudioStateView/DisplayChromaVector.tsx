import { useRef, useEffect } from "react";
import { ColorSwatch, DisplayChromaVectorProps } from "./types";
import { getColorStyles, getSwatchColor } from "./utils";

const MUSICAL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SMOOTHING_FACTOR = 0.3;
const MIN_HEIGHT = 0.05;
const STRONG_NOTE_THRESHOLD = 0.7;
const NOISE_FLOOR = 0.2;

const DisplayChromaVector = ({ label, chromaVector, color }: DisplayChromaVectorProps) => {
  const smoothedValues = useRef<number[]>(new Array(12).fill(0));
  const historicalMax = useRef<number>(0);

  useEffect(() => {
    if (!chromaVector || chromaVector.length !== 12) return;

    const currentMax = Math.max(...Array.from(chromaVector));
    historicalMax.current = Math.max(currentMax, historicalMax.current * 0.95);

    for (let i = 0; i < 12; i++) {
      const normalizedValue = chromaVector[i] / (historicalMax.current || 1);
      const noiseGated = normalizedValue > NOISE_FLOOR ? normalizedValue : 0;
      smoothedValues.current[i] =
        smoothedValues.current[i] * (1 - SMOOTHING_FACTOR) + noiseGated * SMOOTHING_FACTOR;
    }
  }, [chromaVector]);

  if (!chromaVector || chromaVector.length !== 12) {
    return (
      <div
        className="relative flex flex-row gap-[1px] mb-[1px] text-[12px]"
        style={getColorStyles(color)}
      >
        <div className={`grow z-[2] text-[var(${getSwatchColor(color)}, #ffffff)]`}>
          <div className="w-32 text-right">{label}</div>
        </div>
        <div className={`z-[2] w-20 text-right font-mono text-[var(${getSwatchColor(color)}, #ffffff)]`}>
          Invalid
        </div>
      </div>
    );
  }

  const avgAmplitude = smoothedValues.current.reduce((a, b) => a + b, 0) / 12;

  return (
    <div className="relative flex flex-row gap-[1px] mb-[1px] text-[12px]" style={getColorStyles(color)}>
      <div className={`grow z-[2] text-[var(${getSwatchColor(color)}, #ffffff)]`}>
        <div className="w-32 text-right">{label}</div>
        <div className="absolute top-0 left-0 w-full h-full opacity-50">
          <div className="p-1 pl-2">
            <div className="flex flex-row gap-1 h-10">
              {smoothedValues.current.map((amplitude, index) => {
                const normalizedHeight = MIN_HEIGHT + (1 - MIN_HEIGHT) * amplitude;
                const isStrongNote = amplitude > STRONG_NOTE_THRESHOLD && amplitude > avgAmplitude * 1.5;
                const barColor = isStrongNote
                  ? 'bg-blue-500/50'
                  : amplitude > NOISE_FLOOR
                  ? 'bg-blue-500/30'
                  : 'bg-gray-500/20';

                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-purple/50 flex-grow relative" style={{ height: '100%' }}>
                      <div
                        className={`absolute bottom-0 w-full ${barColor}`}
                        style={{
                          height: `${normalizedHeight * 100}%`,
                          transition: 'height 0.1s ease-out',
                        }}
                      />
                    </div>
                    <div className={`mt-1 text-[var(${getSwatchColor(color)}, #ffffff)] text-[10px]`}>
                      {MUSICAL_NOTES[index]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className={`z-[2] w-20 text-right font-mono text-[var(${getSwatchColor(color)}, #ffffff)]`}>
        {avgAmplitude.toFixed(4)}
      </div>
    </div>
  );
};

export default DisplayChromaVector; 