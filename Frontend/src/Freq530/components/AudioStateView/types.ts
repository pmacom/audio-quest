export enum ColorSwatch {
  blue = 'blue',
  white = 'white',
  silver = 'silver',
  red = 'red',
  green = 'green',
  yellow = 'yellow',
  orange = 'orange',
  purple = 'purple',
}

export enum DisplayType {
  Normal,
  Bipolar,
  Boolean,
  ChromaVector,
  Default,
}

export interface DisplayRowProps {
  label: string;
  value: number;
  labelColor: ColorSwatch;
  displayType: DisplayType;
}

export interface DisplayBipolarProps {
  label: string;
  value: number;
  color: ColorSwatch;
  className?: string;
}

export interface DisplayChromaVectorProps {
  label: string;
  value: number; // Required for DisplayRowProps compatibility
  chromaVector: Float32Array;
  color: ColorSwatch;
} 