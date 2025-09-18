// lightness.ts

import {
  hslToRGB,
  rgbToHex,
  rgbToHSL,
  hexToHSL,
  hexToRGB,
  rgbToOKLCH,
} from "./colorUtils";
import { adjustSaturationForLightness } from "./saturation";
import {
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
  MAX_LEVEL,
  MIN_LEVEL,
  MAX_LIGHTNESS,
  MIN_LIGHTNESS,
} from "./constants";
import type { LightnessMethod, RGB } from "./types";

// =============================================================================
// Lightness Calculation Functions
// =============================================================================

/**
 * Get lightness value from color according to lightness calculation method
 */
export const getLightness = ({
  color,
  lightnessMethod = "hybrid",
}: {
  color: string;
  lightnessMethod?: LightnessMethod;
}): number => {
  const rgb = hexToRGB(color);

  switch (lightnessMethod) {
    case "hsl":
      return getHSLLightness(rgb);
    case "perceptual":
      return getPerceptualLightness(rgb);
    case "average":
      return getAverageLightness(rgb);
    case "hybrid":
    default:
      return getHybridLightness(rgb);
  }
};

/**
 * Calculate perceptual lightness from RGB (OKLCH based)
 */
const getPerceptualLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  // Convert RGB directly to OKLCH to get lightness
  const oklch = rgbToOKLCH({ r, g, b });

  // OKLCH lightness is 0-1, convert to 0-100 scale
  return oklch.l * 100;
};

/**
 * Get HSL lightness
 */
const getHSLLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const hsl = rgbToHSL({ r, g, b });
  return hsl.l;
};

/**
 * Get RGB average lightness
 */
const getAverageLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const average = (r + g + b) / 3;
  return (average / 255) * 100;
};

/**
 * Get hybrid lightness (weighted average of perceptual lightness + HSL lightness)
 */
const getHybridLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const perceptual = getPerceptualLightness({ r, g, b });
  const hsl = rgbToHSL({ r, g, b });
  // Weighted average of perceptual lightness and HSL lightness
  return perceptual * 0.3 + hsl.l * 0.7;
};

// =============================================================================
// Lightness Adjustment Functions
// =============================================================================

/**
 * Adjust color to achieve specified lightness
 */
export const adjustToLightness = ({
  h,
  s,
  targetLightness,
  lightnessMethod = "hybrid",
  enableSaturationAdjustment = true,
  baseLightness = 50,
}: {
  h: number;
  s: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
  enableSaturationAdjustment?: boolean;
  baseLightness?: number;
}): string => {
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  s = isFinite(s) ? Math.max(0, Math.min(100, s)) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 50;
  baseLightness = isFinite(baseLightness) ? baseLightness : 50;

  // Adjust saturation based on lightness change if enabled
  const adjustedSaturation = enableSaturationAdjustment
    ? adjustSaturationForLightness({
        h,
        s,
        baseLightness,
        targetLightness,
      })
    : s;

  switch (lightnessMethod) {
    case "hsl":
      return adjustToHSLLightness({
        h,
        s: adjustedSaturation,
        targetLightness,
      });
    default:
      return adjustToLightnessByBinarySearch({
        h,
        s: adjustedSaturation,
        targetLightness,
        lightnessMethod,
      });
  }
};

/**
 * Direct adjustment by HSL lightness (100% round-trip consistency guaranteed)
 */
const adjustToHSLLightness = ({
  h,
  s,
  targetLightness,
}: {
  h: number;
  s: number;
  targetLightness: number;
}): string => {
  const hsl = { h, s, l: targetLightness };
  const rgb = hslToRGB(hsl);
  return rgbToHex(rgb);
};

/**
 * Lightness adjustment by binary search
 */
const adjustToLightnessByBinarySearch = ({
  h,
  s,
  targetLightness,
  lightnessMethod = "hybrid",
}: {
  h: number;
  s: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
}): string => {
  const MAX_ITERATIONS = 100;
  const PRECISION_THRESHOLD = 0.001;

  let low = 0;
  let high = 100;
  let bestL = 50;
  let bestDiff = Infinity;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const rgb = hslToRGB({ h, s, l: mid });
    const currentLightness = getLightness({
      color: rgbToHex(rgb),
      lightnessMethod: lightnessMethod,
    });
    const diff = Math.abs(currentLightness - targetLightness);

    // Record L value with minimum error
    if (diff < bestDiff) {
      bestDiff = diff;
      bestL = mid;
    }

    // Exit if sufficient precision is reached
    if (diff < PRECISION_THRESHOLD) break;

    // Exit if range becomes sufficiently small
    if (high - low < PRECISION_THRESHOLD) break;

    if (currentLightness < targetLightness) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const finalRgb = hslToRGB({ h, s, l: bestL });
  return rgbToHex(finalRgb);
};

// =============================================================================
// Scale Generation Functions
// =============================================================================

/**
 * Find the closest lightness level to the specified color
 */
export const findClosestLevel = ({
  inputLightness,
  lightnessMethod = "hybrid",
}: {
  inputLightness: number;
  lightnessMethod?: LightnessMethod;
}): number => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  return SCALE_LEVELS.reduce((closestLevel, current) => {
    const lightness =
      lightnessMethod !== "perceptual"
        ? getAdjustedLightness({ level: current, lightnessMethod })
        : STANDARD_LIGHTNESS_SCALE[current];

    const currentDiff = Math.abs(inputLightness - lightness);
    const closestDiff = Math.abs(
      inputLightness -
        (lightnessMethod !== "perceptual"
          ? getAdjustedLightness({ level: closestLevel, lightnessMethod })
          : STANDARD_LIGHTNESS_SCALE[closestLevel])
    );

    return currentDiff < closestDiff ? current : closestLevel;
  });
};

/**
 * Calculate even scale based on the specified color
 */
export const calculateEvenScale = ({
  inputLightness,
  baseLevel,
}: {
  inputLightness: number;
  baseLevel: number;
}): Record<number, number> => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  const clampedInputLightness = Math.max(
    MIN_LIGHTNESS,
    Math.min(MAX_LIGHTNESS, inputLightness)
  );

  if (!SCALE_LEVELS.includes(baseLevel)) baseLevel = 500;

  const STEP_SIZE = 50;
  const baseIndex = (baseLevel - MIN_LEVEL) / STEP_SIZE;
  const totalSteps = (MAX_LEVEL - MIN_LEVEL) / STEP_SIZE;

  const upwardSteps = baseIndex;
  const downwardSteps = totalSteps - baseIndex;

  const availableUpward = MAX_LIGHTNESS - clampedInputLightness;
  const availableDownward = clampedInputLightness - MIN_LIGHTNESS;

  const upwardInterval = upwardSteps > 0 ? availableUpward / upwardSteps : 0;
  const downwardInterval =
    downwardSteps > 0 ? availableDownward / downwardSteps : 0;

  const evenScale: Record<number, number> = {};
  evenScale[baseLevel] = clampedInputLightness;

  // Upper levels (bright direction)
  for (let i = 1; i <= upwardSteps; i++) {
    const level = baseLevel - i * STEP_SIZE;
    const lightness = Math.min(
      clampedInputLightness + upwardInterval * i,
      MAX_LIGHTNESS
    );
    evenScale[level] = lightness;
  }

  // Lower levels (dark direction)
  for (let i = 1; i <= downwardSteps; i++) {
    const level = baseLevel + i * STEP_SIZE;
    const lightness = Math.max(
      clampedInputLightness - downwardInterval * i,
      MIN_LIGHTNESS
    );
    evenScale[level] = lightness;
  }

  // Return clamped results
  const adjustedLightnessScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    if (evenScale[level] !== undefined) {
      adjustedLightnessScale[level] = Math.max(
        MIN_LIGHTNESS,
        Math.min(MAX_LIGHTNESS, evenScale[level])
      );
    }
  });

  return adjustedLightnessScale;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get adjusted lightness according to method
 */
const getAdjustedLightness = ({
  level,
  lightnessMethod,
}: {
  level: number;
  lightnessMethod: LightnessMethod;
}): number => {
  const normalizedLevel = (level - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);

  switch (lightnessMethod) {
    case "hsl":
    case "average":
      return MAX_LIGHTNESS - normalizedLevel * (MAX_LIGHTNESS - MIN_LIGHTNESS);
    case "hybrid":
      const perceptualLightness = STANDARD_LIGHTNESS_SCALE[level];
      const linearLightness =
        MAX_LIGHTNESS - normalizedLevel * (MAX_LIGHTNESS - MIN_LIGHTNESS);
      return perceptualLightness * 0.3 + linearLightness * 0.7;
    case "perceptual":
    default:
      return STANDARD_LIGHTNESS_SCALE[level];
  }
};
