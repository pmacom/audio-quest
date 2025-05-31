import { checkValuesAgainstBoundaries, Direction, Range } from "react-range";
import type { ITrackBackground } from "react-range/lib/types";
export function getTrackBackground({
  values,
  colors,
  min,
  max,
  direction = Direction.Right,
  rtl = false,
}: ITrackBackground) {
  if (rtl && direction === Direction.Right) {
    direction = Direction.Left;
  } else if (rtl && direction === Direction.Left) {
    direction = Direction.Right;
  }

  // Sort values ascending and map to percentages
  const progress = values
    .slice(0)
    .sort((a, b) => a - b)
    .map((value) => ((value - min) / (max - min)) * 100);

  let middle: string;

  // Special case for 5 colors with abrupt and smooth transitions
  if (colors.length === 5 && progress.length >= 2) {
    middle = `
      , ${`rgba(255, 255, 255, .02)`} 0%
      , ${colors[0]} ${progress[0]}%
      , ${colors[1]} ${progress[1]}%  /* Abrupt transition from 1st to 2nd */
      , ${colors[0]} ${progress[2]}%  /* Smooth transition from 3rd to 4th continues */
      , ${`rgba(255, 255, 255, .02)`} 100%
    `;
  } else {
    // Fallback to original behavior for other cases
    middle = progress.reduce(
      (acc, point, index) =>
        `${acc}, ${colors[index]} ${point/2}%, ${colors[index]} ${point}%, ${colors[index + 1]} ${point}%`,
      ""
    );
  }

  return `linear-gradient(${direction}, ${colors[0]} 0%${middle}, ${
    colors[colors.length - 1]
  } 100%)`;
}