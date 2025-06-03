import { create } from 'zustand'
import { createRef } from 'react'
import protobuf from 'protobufjs'
import { Freq530FieldType } from '../../types'
import { Freq530FieldKeys } from '@/Freq530/constants'

const debug = false

export const Freq530FieldTypes: Record<typeof Freq530FieldKeys[number], Freq530FieldType> = {
  time: Freq530FieldType.Number,
  adjustedTime: Freq530FieldType.Number,
  sin: Freq530FieldType.Neg1To1,
  cos: Freq530FieldType.Neg1To1,
  sinNormal: Freq530FieldType.Zero1,
  cosNormal: Freq530FieldType.Zero1,
  adjustedSin: Freq530FieldType.Neg1To1,
  adjustedCos: Freq530FieldType.Neg1To1,
  adjustedSinNormal: Freq530FieldType.Zero1,
  adjustedCosNormal: Freq530FieldType.Zero1,
  low: Freq530FieldType.Zero1,
  mid: Freq530FieldType.Zero1,
  high: Freq530FieldType.Zero1,
  kick: Freq530FieldType.Zero1,
  snare: Freq530FieldType.Zero1,
  hihat: Freq530FieldType.Zero1,
  vocalLikelihood: Freq530FieldType.Zero1,
  amplitude: Freq530FieldType.Zero1,
  rawAmplitude: Freq530FieldType.Number,
  beatIntensity: Freq530FieldType.Number,
  bps: Freq530FieldType.Number,
  
  lowDynamic: Freq530FieldType.Zero1,
  midDynamic: Freq530FieldType.Zero1,
  highDynamic: Freq530FieldType.Zero1,
  kickDynamic: Freq530FieldType.Zero1,
  snareDynamic: Freq530FieldType.Zero1,
  hihatDynamic: Freq530FieldType.Zero1,
  amplitudeDynamic: Freq530FieldType.Zero1,
  rawAmplitudeDynamic: Freq530FieldType.Number,

  spectralFlux: Freq530FieldType.Zero1,
  beatTimes: Freq530FieldType.NumberArray,
  lastBeatTime: Freq530FieldType.Number,
  quantizedBands: Freq530FieldType.NumberArrayBars,
  spectogram: Freq530FieldType.Spectogram,
  
  // New audio fields
  spectralCentroid: Freq530FieldType.Zero1,
  chromagram: Freq530FieldType.NumberArray,
  beatPhase: Freq530FieldType.Zero1,
  frequencyGridMap: Freq530FieldType.NumberArray,
}

export type Freq530Field = typeof Freq530FieldKeys[number]
// export type Freq530ValueMap = Record<Freq530Field, number>
// export type Freq530RefMap = Record<Freq530Field, React.MutableRefObject<number>>
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

export interface Freq530Store {
  connectionState: ConnectionState
  connectWebSocket: () => void
  values: Freq530ValueMap
  refs: Freq530RefMap
}

let counter = 50

// we need a ValueMap that gives array fields their proper types:
export type Freq530ValueMap = {
  [K in Freq530Field]:
    K extends 'beatTimes' | 'quantizedBands' | 'chromagram' | 'frequencyGridMap' ? number[] : number
}

// refs must hold the same types:
export type Freq530RefMap = {
  [K in Freq530Field]:
    React.RefObject<
      K extends 'beatTimes' | 'quantizedBands' | 'chromagram' | 'frequencyGridMap' ? number[] : number
    >
}

export const useFreq530 = create<Freq530Store>((set, get) => {
  const arrayFields = ['beatTimes', 'quantizedBands', 'chromagram', 'frequencyGridMap'] as const
  
  const values = Object.fromEntries(
    Freq530FieldKeys.map(k => [k, arrayFields.includes(k as any) ? [] : 0])
  ) as unknown as Freq530ValueMap
  
  const refs = Object.fromEntries(
    Freq530FieldKeys.map(k => [k, arrayFields.includes(k as any) ? createRef<number[]>() : createRef<number>()])
  ) as unknown as Freq530RefMap
  
  for (const k of Freq530FieldKeys) {
    if (arrayFields.includes(k as any)) {
      (refs[k] as React.RefObject<number[]>).current = []
    } else {
      (refs[k] as React.RefObject<number>).current = 0
    }
  }

  return {
    connectionState: 'idle',
    values,
    refs,
    connectWebSocket: () => {
      if (get().connectionState !== 'idle') return
      set({ connectionState: 'connecting' })

      protobuf.load('/state.proto', (err, root) => {
        if (err || !root) {
          set({ connectionState: 'error' })
          return
        }

        const ProtoType = root.lookupType('PrimaryFreq530State')
        const ws = new WebSocket('ws://127.0.0.1:8765')
        ws.binaryType = 'arraybuffer'

        ws.onopen = () => set({ connectionState: 'connected' })
        ws.onerror = () => set({ connectionState: 'error' })
        ws.onclose = () => set({ connectionState: 'idle' })

        ws.onmessage = (event) => {

          try {
            const msg = ProtoType.decode(new Uint8Array(event.data))
            const obj = ProtoType.toObject(msg, { defaults: true }) as Partial<Freq530ValueMap>
            const nextValues = { ...get().values }

            // Debug: Log the decoded object to see what fields we're actually receiving
            if (counter > 45) {
              if (debug) console.log('Decoded proto object keys:', Object.keys(obj)) // debug
              if (debug) console.log('Looking for frequencyGridMap, found:', obj.frequencyGridMap) // debug
              if (debug) console.log('Looking for frequency_grid_map, found:', (obj as any).frequency_grid_map) // debug
              if (debug) console.log('Looking for frequencyGridMap length:', obj.frequencyGridMap?.length) // debug
              counter--
            }

            for (const k of Freq530FieldKeys) {
              const value = obj[k]
              if (arrayFields.includes(k as any) && Array.isArray(value)) {
                (nextValues as any)[k] = value
                ;(get().refs[k] as React.RefObject<number[]>).current = value
                
                // Debug specifically for frequencyGridMap
                if (k === 'frequencyGridMap' && Array.isArray(value) && value.length > 0) {
                  if (debug) console.log('FREQUENCY GRID MAP UPDATED:', value.length, 'values, first few:', value.slice(0, 5)) // debug
                }
              } else if (typeof value === "number" && !arrayFields.includes(k as any)) {
                // Sanitize special values
                let safeValue = value
                if (!isFinite(value) || isNaN(value)) {
                  safeValue = 0
                }
                (nextValues as any)[k] = safeValue
                if(counter > 0) {
                  // console.log('Decoded proto object:', obj)
                  // console.log('NOTICE THIS', k, value)
                  counter--
                }
                // console.log(`setting ${k} to ${safeValue}`)
                ;(get().refs[k] as React.RefObject<number>).current = safeValue
              }
            }
            set({ values: nextValues })
          } catch (error) {
            console.error('Error processing WebSocket message:', error)
          }
        }
      })
    }
  }
})

