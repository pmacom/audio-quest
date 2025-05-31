import { ColorSwatch } from "./types";

export function getNormalizedUnit(value: number, minDigits: number = 4): { formatted: string; isNegative: boolean } {
  if (isNaN(value) || value == null) {
    return { formatted: `${'0'.repeat(minDigits)}.${'0'.repeat(minDigits)}`, isNegative: false };
  }

  const rounded = Number(value.toFixed(4));
  const numStr = rounded.toString();
  const [integerPart, fractionalPart = ''] = numStr.split('.');
  const cleanInteger = integerPart.replace(/^-/, '').replace(/^0+/, '') || '0';
  const cleanFractional = fractionalPart.replace(/0+$/, '');
  const integerDigits = cleanInteger === '0' ? 0 : cleanInteger.length;
  const fractionalDigits = cleanFractional.length;
  const targetDigits = Math.max(integerDigits, fractionalDigits, minDigits);
  const isNegative = value < 0;
  const paddedInteger = cleanInteger.padStart(targetDigits, '0');
  const paddedFractional = cleanFractional.padEnd(targetDigits, '0');

  return { formatted: `${paddedInteger}.${paddedFractional}`, isNegative };
}

export const getSwatchColor = (labelColor: ColorSwatch): string => {
  return `--color-${labelColor}`;
};

export const getColorStyles = (labelColor: ColorSwatch): React.CSSProperties => {
  const colorMap: Record<ColorSwatch, string> = {
    [ColorSwatch.blue]: '#3b82f6', // blue-500
    [ColorSwatch.white]: '#ffffff',
    [ColorSwatch.silver]: '#6b7280', // gray-500
    [ColorSwatch.red]: '#ef4444', // red-500
    [ColorSwatch.green]: '#22c55e', // green-500
    [ColorSwatch.yellow]: '#eab308', // yellow-500
    [ColorSwatch.orange]: '#f97316', // orange-500
    [ColorSwatch.purple]: '#a855f7', // purple-500
  };
  return {
    [`--color-${labelColor}`]: colorMap[labelColor] || '#ffffff',
  };
};

/**
 * Returns the normalized value for a tweak slot based on the sourceId and audioState.
 * If the sourceId is not connected, returns undefined.
 */
export function getNormalizedTweakValue(
  sourceId: string | undefined,
  audioState: Record<string, any>
): number | undefined {
  if (!sourceId) return undefined;
  let rawValue = audioState[sourceId as keyof typeof audioState];
  if (typeof rawValue === "boolean") rawValue = rawValue ? 1 : 0;
  if (rawValue instanceof Float32Array) rawValue = 0;
  if (typeof rawValue !== "number") rawValue = 0;

  switch (sourceId) {
    case "time":
    case "adjustedTime":
      return (rawValue % 1);
    case "sin":
    case "cos":
    case "adjustedSin":
    case "adjustedCos":
      return (rawValue + 1) / 2;
    case "sinNormal":
    case "cosNormal":
    case "adjustedSinNormal":
    case "adjustedCosNormal":
      return rawValue;
    case "low":
    case "mid":
    case "high":
    case "kick":
    case "snare":
    case "hihat":
    case "vocalLikelihood":
    case "amplitude":
    case "rawAmplitude":
    case "beatIntensity":
    case "bps":
      return rawValue;
    default:
      return rawValue;
  }
} 