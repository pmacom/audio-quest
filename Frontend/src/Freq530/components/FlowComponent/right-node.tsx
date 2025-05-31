"use client"

import { memo } from "react"
import { UniformRange } from "../TweakView/UniformRange"
import { useFreq530 } from "@/Freq530/stores/useFreq530"
import { useTweakStore } from "@/Freq530/stores/useTweakStore"
import { useShaderSettings } from "@/Freq530/stores/useShaderSettings"

type Connection = {
  id: string
  name: string
}

type RightNodeProps = {
  data: {
    connections: Connection[]
  }
}

const RightNode = ({ data }: RightNodeProps) => {
  const { shaderSettings, selectedShaderId, updateTweakRange, setManualTweakValue } = useShaderSettings();
  const shader = shaderSettings.find(s => s.id === selectedShaderId);
  const audioState = useFreq530();
  if (!shader) return null;

  return (
    <div className="border-l-2 border-gray-300/20 bg-transparent h-screen overflow-y-auto fixed top-0 right-0 w-64 z-10">
      <div className="sticky top-0 bg-transparent p-2 border-b border-gray-200/20 z-20">
        <div className="text-center font-bold mb-1 text-lg">Shader Tweaks</div>
      </div>
      <div className="p-2 space-y-1">
        {data.connections.map((connection, i) => {
          const tweak = shader.ranges[i];
          let value = tweak.manualValue ?? tweak.value;
          let disabled = false;
          if (tweak.source) {
            // If connected, show audio value mapped to [min, max] and disable manual editing
            const audioVal = audioState[tweak.source as keyof typeof audioState];
            // Ensure audioVal is normalized (0-1). If not, normalize it here.
            let normalized = 0;
            if (typeof audioVal === 'number') {
              // Try to normalize based on known ranges for common audio keys
              switch (tweak.source) {
                case 'sin':
                case 'cos':
                case 'adjustedSin':
                case 'adjustedCos':
                  normalized = (audioVal + 1) / 2;
                  break;
                case 'sinNormal':
                case 'cosNormal':
                case 'adjustedSinNormal':
                case 'adjustedCosNormal':
                  normalized = audioVal; // already 0-1
                  break;
                case 'time':
                case 'adjustedTime':
                  normalized = audioVal % 1;
                  break;
                default:
                  normalized = audioVal; // assume already normalized or in [0,1]
              }
            }
            value = tweak.min + (tweak.max - tweak.min) * normalized;
            disabled = true;
          }
          return (
            <div key={connection.id} className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold flex-1">{connection.name}</span>
                <select
                  className="text-xs px-1 py-0.5 border rounded"
                  value={tweak.source || ''}
                  onChange={e => updateTweakRange(i, { source: e.target.value || null })}
                >
                  <option value="">Manual</option>
                  {/* TODO: Populate with available audio sources */}
                  <option value="low">low</option>
                  <option value="mid">mid</option>
                  <option value="high">high</option>
                  <option value="kick">kick</option>
                  <option value="snare">snare</option>
                  <option value="hihat">hihat</option>
                  <option value="vocalLikelihood">vocalLikelihood</option>
                  <option value="amplitude">amplitude</option>
                  <option value="rawAmplitude">rawAmplitude</option>
                  <option value="beatIntensity">beatIntensity</option>
                  <option value="bps">bps</option>
                  <option value="sin">sin</option>
                  <option value="cos">cos</option>
                  <option value="adjustedSin">adjustedSin</option>
                  <option value="adjustedCos">adjustedCos</option>
                  <option value="sinNormal">sinNormal</option>
                  <option value="cosNormal">cosNormal</option>
                  <option value="time">time</option>
                  <option value="adjustedTime">adjustedTime</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <UniformRange
                  min={tweak.min}
                  max={tweak.max}
                  value={value}
                  onChange={([newMin, newValue, newMax]) => {
                    // Always update min/max in the store
                    if (newMin !== tweak.min) setTimeout(() => updateTweakRange(i, { min: newMin }), 0);
                    if (newMax !== tweak.max) setTimeout(() => updateTweakRange(i, { max: newMax }), 0);
                    // Only update manual value if not connected
                    if (!tweak.source) setTimeout(() => setManualTweakValue(i, newValue), 0);
                  }}
                  disabled={false}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { useTweakStore }
export default memo(RightNode)
