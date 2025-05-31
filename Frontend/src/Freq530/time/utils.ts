import { EASING_FUNCTION } from "../ease/ease";
import { EASING_FUNCTION_ACTION } from "../ease/ease";

const updateMirrorValue = (
  accumulativeTime: number,
  duration: number
) => {
  // Full cycle is twice the duration (forward + backward)
  const cycleDuration = duration * 2;
  const normalizedTime = accumulativeTime % cycleDuration;
  const t = normalizedTime / duration;

  let value: number;
  let direction: number;

  if (t <= 1) {
    // Moving forward (0 to 1)
    value = t;
    direction = 1;
  } else {
    // Moving backward (1 to 0)
    value = 2 - t;
    direction = -1;
  }

  return { value, direction };
}

const updateEasedMirrorValue = (
  accumulativeTime: number,
  duration: number,
  easingKey: EASING_FUNCTION
) => {
  // Full cycle is twice the duration (forward + backward)
  const cycleDuration = duration * 2;
  const normalizedTime = accumulativeTime % cycleDuration;
  const t = normalizedTime / duration;

  let rawValue: number;
  let direction: number;

  if (t <= 1) {
    // Moving forward (0 to 1)
    rawValue = t;
    direction = 1;
  } else {
    // Moving backward (1 to 0)
    rawValue = 2 - t;
    direction = -1;
  }

  const easeFn = EASING_FUNCTION_ACTION[easingKey];
  const easedValue = easeFn(rawValue);

  return { value: easedValue, direction };
}

const updateEasedMirrorRangeValue = (
  accumulativeTime: number,
  duration: number,
  easingKey: EASING_FUNCTION,
  min: number,
  max: number
) => {
  // Full cycle is twice the duration (forward + backward)
  const cycleDuration = duration * 2;
  const normalizedTime = accumulativeTime % cycleDuration;
  const t = normalizedTime / duration;

  let rawValue: number;
  let direction: number;

  if (t <= 1) {
    // Moving forward (0 to 1)
    rawValue = t;
    direction = 1;
  } else {
    // Moving backward (1 to 0)
    rawValue = 2 - t;
    direction = -1;
  }

  const easeFn = EASING_FUNCTION_ACTION[easingKey];
  const eased = easeFn(Math.abs(rawValue));
  const rangedValue = min + (max - min) * eased;

  return { value: rangedValue, direction };
}

const updateTimeValues = (time: number, adjustedAccumulatedTime: number) => {
  return {
    sinValue: Math.sin(time),
    cosValue: Math.cos(time),
    sinNormalValue: Math.abs(Math.sin(adjustedAccumulatedTime)),
    cosNormalValue: Math.abs(Math.cos(adjustedAccumulatedTime)),
  };
};

const calculateAdjustedAccumulatedTime = (
  currentAdjustedAccumulatedTime: number,
  time: number,
  multiplier: number,
  deltaTime: number
) => {
  return currentAdjustedAccumulatedTime + (time/4) + (multiplier * deltaTime);
};

export const UTILS_TIME = {
  updateMirrorValue,
  updateEasedMirrorValue,
  updateEasedMirrorRangeValue,
  updateTimeValues,
  calculateAdjustedAccumulatedTime
}