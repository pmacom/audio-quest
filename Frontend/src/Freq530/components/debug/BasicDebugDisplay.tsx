"use client"

import { useFreq530 } from "@/Freq530/stores/useFreq530";
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChromaVectorView } from "./ChromaVectorView";

export const BasicDebugDisplay = () => {
  const {
    time,
    adjustedTime,
    sin,
    cos,
    sinNormal,
    cosNormal,
    adjustedSin,
    adjustedCos,
    adjustedSinNormal,
    adjustedCosNormal,
    low,
    mid,
    high,
    kick,
    snare,
    hihat,
    vocalLikelihood,
    amplitude,
    rawAmplitude,
    beatIntensity,
    bps,
    isAudioActive,
    isInitialized,
    spectralCentroid,
    chromaVector,
    dominantNote,
    isOnset,
    bpm,
    tempoStability,
    beatPhase,
  } = useFreq530();

  const groupClasses = cn("p-[1px] m-[1px] border-[1px] border-white/50 rounded-lg")
  
  return (
    <div className="absolute top-0 left-0 w-full h-full z-10 text-white">
      <div className={groupClasses}>
        <h1>Time Values</h1>
        <Debug_ValueView_Standard label="Time" value={time} />
        <Debug_ValueView_Standard label="Adjusted Time" value={adjustedTime} />
        <Debug_ValueView_Bipolar label="Sin" value={sin} />
        <Debug_ValueView_Bipolar label="Cos" value={cos} />
        <Debug_ValueView_Bipolar label="Adjusted Sin" value={adjustedSin} />
        <Debug_ValueView_Bipolar label="Adjusted Cos" value={adjustedCos} />
        <Debug_ValueView_Normalized color="orange" label="Sin Normal" value={sinNormal} />
        <Debug_ValueView_Normalized color="gold" label="Cos Normal" value={cosNormal} />
        <Debug_ValueView_Normalized color="blue" label="Adjusted Sin Normal" value={adjustedSinNormal} />
        <Debug_ValueView_Normalized color="purple" label="Adjusted Cos Normal" value={adjustedCosNormal} />
      </div>

      <div className={groupClasses}>
        <h1>Audio Values</h1>
        <Debug_ValueView_Normalized label="Low" value={low} />
        <Debug_ValueView_Normalized label="Mid" value={mid} />
        <Debug_ValueView_Normalized label="High" value={high} />
        <Debug_ValueView_Normalized label="Kick" value={kick} />
        <Debug_ValueView_Normalized label="Snare" value={snare} />
        <Debug_ValueView_Normalized label="Hihat" value={hihat} />
        <Debug_ValueView_Normalized label="Vocal Likelihood" value={vocalLikelihood} />
        <Debug_ValueView_Normalized label="Amplitude" value={amplitude} addOne />
        <Debug_ValueView_Normalized label="Raw Amplitude" value={rawAmplitude} />
        <Debug_ValueView_Normalized label="Beat Intensity" value={beatIntensity} />
        <Debug_ValueView_Standard label="BPS" value={bps} />
        <Debug_ValueView_Standard label="BPM" value={bpm} />
      </div>

      <div className={groupClasses}>
        <h1>Enhanced Features</h1>
        <Debug_ValueView_Standard label="Spectral Centroid" value={spectralCentroid} />
        <Debug_ValueView_Normalized label="Tempo Stability" value={tempoStability} />
        <Debug_ValueView_Normalized label="Beat Phase" value={beatPhase} />
        <Debug_ValueView_Boolean label="Is Onset" value={isOnset} />
        <ChromaVectorView label="Chroma Vector" value={chromaVector} dominantNote={dominantNote} />
      </div>
    </div>
  )
}

const Debug_ValueView_Standard = ({ label, value }: { label: string, value: number }) => {
  return (
    <div className="ml-2 my-1 relative text-[11px] text-white flex flex-row gap-[1px]">
      <div className="w-30 text-yellow-500">{label}</div>
      <div className="text-white">{value.toFixed(3)}</div>
    </div>
  )
}

const Debug_ValueView_Boolean = ({ label, value }: { label: string, value: boolean }) => {
  const color = useMemo(() => value ? "bg-green-500/50" : "bg-red-500/50", [value])
  return (
    <div className="relative text-[11px] text-white flex flex-row gap-2 flex items-center">
      <div className="pl-2 w-30 text-yellow-500">{label}</div>
      <div className={`text-white ${color} w-3 h-3 rounded-full`} />
    </div>
  )
}

interface Debug_ValueView_NormalizedProps {
  label: string
  value: number
  color?: string
  double?: boolean
  addOne?: boolean
}
const Debug_ValueView_Normalized = ({
  label,
  value,
  color = "blue",
  double = false,
  addOne = false
}: Debug_ValueView_NormalizedProps) => {  
  return (
    <div className="p-1 pl-2 h-5 my-1 relative text-[11px] text-white flex flex-row gap-2">
      <div className="w-30 text-yellow-500">{label}</div>
      <div className="text-white">{value.toFixed(3)}</div>
      <div className="z-[-1] absolute top-0 left-0 w-full h-full bg-purple-500/50">
        <div className={`h-full opacity-30`} style={{
          width: `${(value * 100) - (addOne ? 1 : 0)}%`,
          backgroundColor: color,
        }}></div>
      </div>
    </div>
  )
}

interface Debug_ValueView_BipolarProps {
  value: number
  label: string
  className?: string
}

export function Debug_ValueView_Bipolar({ value, label, className }: Debug_ValueView_BipolarProps) {
  const widthPercentage = Math.abs(value) * 50
  const isNegative = value < 0
  const position = isNegative ? "left" : "right"
  const barColor = isNegative ? "bg-red-500/50" : "bg-green-500/50"
  const wrapperClasses = useMemo(() => {
    return cn("w-50 mb-1", className)
  }, [className])
  const barClasses = useMemo(() => {
    return cn("absolute top-0 bottom-0 h-full", barColor)
  }, [barColor])

  return (
    <div className={wrapperClasses}>
      <div className="relative h-4 rounded-sm overflow-hidden" aria-hidden="true">
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50" />

        {/* Value bar */}
        <div
          className={barClasses}
          style={{
            width: `${widthPercentage}%`,
            [position]: "50%",
          }}
        />

        {/* Title overlay */}
        <div className="absolute top-0 bottom-0 left-2 flex items-center">
          <span className="text-[11px] font-medium text-white truncate max-w-[120px]">{label}</span>
        </div>

        {/* Value display */}
        <div className="absolute top-0 bottom-0 right-2 flex items-center">
          <span className="text-[11px] font-mono">{value.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
