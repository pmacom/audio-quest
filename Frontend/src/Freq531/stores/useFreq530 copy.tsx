import { create } from 'zustand'
import { createRef } from 'react'
import protobuf from 'protobufjs'

export const enum Freq530FieldType {
  Neg1To1 = 'neg1to1',
  Zero1 = 'zero1',
  Number = 'number',
}

export const Freq530FieldKeys = [
  'time', 'adjustedTime',
  'sin', 'cos', 'sinNormal', 'cosNormal',
  'adjustedSin', 'adjustedCos', 'adjustedSinNormal', 'adjustedCosNormal',
  'low', 'mid', 'high', 'kick', 'snare', 'hihat',
  'vocalLikelihood', 'amplitude', 'rawAmplitude',
  'beatIntensity', 'bps',
  'lowDynamic', 'midDynamic', 'highDynamic',
  'kickDynamic', 'snareDynamic', 'hihatDynamic',
  'amplitudeDynamic', 'rawAmplitudeDynamic',
] as const

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

  
}

export type Freq530Field = typeof Freq530FieldKeys[number]
export type Freq530ValueMap = Record<Freq530Field, number>
export type Freq530RefMap = Record<Freq530Field, React.MutableRefObject<number>>
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

export interface Freq530Store {
  connectionState: ConnectionState
  connectWebSocket: () => void
  values: Freq530ValueMap
  refs: Freq530RefMap
}

export const useFreq530 = create<Freq530Store>((set, get) => {
  const values = Object.fromEntries(Freq530FieldKeys.map(k => [k, 0])) as Freq530ValueMap
  const refs = Object.fromEntries(Freq530FieldKeys.map(k => [k, createRef<number>()])) as Freq530RefMap
  for (const k of Freq530FieldKeys) refs[k].current = 0

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

            for (const k of Freq530FieldKeys) {
              const value = obj[k]
              if (typeof value === 'number') {
                nextValues[k] = value
                get().refs[k].current = value
              }
            }

            set({ values: nextValues })
          } catch {}
        }
      })
    }
  }
})

