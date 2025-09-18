// lightness.ts

import {
  hslToRGB,
  rgbToHex,
  rgbToHSL,
  hexToHSL,
  hexToRGB,
  rgbToOKLCH,
} from "./colorUtils";
import {
  adjustSaturationForLightness,
  getTheoreticalSaturationCoefficient,
  getPerceptualSaturation,
} from "./saturation";
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
export const getHybridLightness = ({
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
  return perceptual * 0.4 + hsl.l * 0.6;
};

/**
 * Get hybrid saturation (weighted average of perceptual saturation + HSL saturation)
 */
export const getHybridSaturation = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const perceptual = getPerceptualSaturation({ r, g, b });
  const hsl = rgbToHSL({ r, g, b });
  // Weighted average of perceptual saturation and HSL saturation
  return perceptual * 0.4 + hsl.s * 0.6;
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
  baseColor,
}: {
  h: number;
  s: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
  enableSaturationAdjustment?: boolean;
  baseLightness?: number;
  baseColor?: string;
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
    case "perceptual":
      // For perceptual lightness, use direct perceptual lightness adjustment
      return adjustToPerceptualLightness({
        h,
        s: adjustedSaturation,
        targetLightness,
      });
    case "hybrid":
      // For hybrid lightness, use direct hybrid lightness adjustment
      return adjustToHybridLightness({
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
        baseLightness,
        baseColor,
      });
  }
};

/**
 * Direct adjustment by HSL lightness (100% round-trip consistency guaranteed)
 */
export const adjustToHSLLightness = ({
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
 * Direct adjustment by perceptual lightness using binary search
 */
export const adjustToPerceptualLightness = ({
  h,
  s,
  targetLightness,
}: {
  h: number;
  s: number;
  targetLightness: number;
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
    const currentLightness = getPerceptualLightness(rgb);
    const diff = Math.abs(currentLightness - targetLightness);

    // Record L value with best lightness match
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

/**
 * Direct adjustment by hybrid lightness using binary search
 */
export const adjustToHybridLightness = ({
  h,
  s,
  targetLightness,
}: {
  h: number;
  s: number;
  targetLightness: number;
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
    const currentLightness = getHybridLightness(rgb);
    const diff = Math.abs(currentLightness - targetLightness);

    // Record L value with best lightness match
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

/**
 * Lightness adjustment with OKLCH chroma preservation using theoretical curve
 */
const adjustToLightnessByBinarySearch = ({
  h,
  s,
  targetLightness,
  lightnessMethod = "hybrid",
  baseLightness = 50,
  baseColor,
}: {
  h: number;
  s: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
  baseLightness?: number;
  baseColor?: string;
}): string => {
  // Step 1: For base color level, return the original color to preserve its chroma
  if (baseColor) {
    const baseColorLightness = getLightness({
      color: baseColor,
      lightnessMethod,
    });
    if (Math.abs(targetLightness - baseColorLightness) < 1) {
      return baseColor;
    }
  }

  // Step 1: Generate color with specified lightness method
  const initialColor = adjustToHSLLightness({
    h,
    s,
    targetLightness,
  });

  // Step 2: Use base color chroma directly (without theoretical curve)
  const baseRgb = baseColor
    ? hexToRGB(baseColor)
    : hslToRGB({ h, s, l: baseLightness });
  const baseOKLCH = rgbToOKLCH(baseRgb);
  const targetChroma = baseOKLCH.c; // Use base color chroma directly

  // Get current OKLCH values
  const currentRGB = hexToRGB(initialColor);
  const currentOKLCH = rgbToOKLCH(currentRGB);

  // If chroma is already close to target, return initial color
  if (Math.abs(currentOKLCH.c - targetChroma) < 0.001) {
    return initialColor;
  }

  // Step 3: Adjust HSL saturation to match target chroma
  const adjustedColor = adjustHSLForOKLCHChroma({
    h,
    s,
    l: targetLightness,
    targetChroma,
    lightnessMethod,
    targetLightness,
  });

  return adjustedColor;
};

/**
 * Adjust HSL saturation to match target OKLCH chroma
 */
const adjustHSLForOKLCHChroma = ({
  h,
  s,
  l,
  targetChroma,
  lightnessMethod,
  targetLightness,
}: {
  h: number;
  s: number;
  l: number;
  targetChroma: number;
  lightnessMethod: LightnessMethod;
  targetLightness: number;
}): string => {
  const MAX_ITERATIONS = 50;
  const PRECISION_THRESHOLD = 0.001;

  let low = 0;
  let high = 100;
  let bestS = s;
  let bestDiff = Infinity;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const rgb = hslToRGB({ h, s: mid, l });
    const currentOKLCH = rgbToOKLCH(rgb);
    const chromaDiff = Math.abs(currentOKLCH.c - targetChroma);

    // Record S value with best chroma match
    if (chromaDiff < bestDiff) {
      bestDiff = chromaDiff;
      bestS = mid;
    }

    // Exit if sufficient precision is reached
    if (chromaDiff < PRECISION_THRESHOLD) break;

    // Exit if range becomes sufficiently small
    if (high - low < PRECISION_THRESHOLD) break;

    if (currentOKLCH.c < targetChroma) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Step 4: Adjust lightness if it deviated from target
  const finalRGB = hslToRGB({ h, s: bestS, l });
  const finalLightness = getLightness({
    color: rgbToHex(finalRGB),
    lightnessMethod,
  });
  const lightnessDiff = Math.abs(finalLightness - targetLightness);

  // If lightness deviated significantly, adjust it
  if (lightnessDiff > 0.01) {
    return adjustToHSLLightness({
      h,
      s: bestS,
      targetLightness,
    });
  }

  return rgbToHex(finalRGB);
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
    case "perceptual":
    default:
      return STANDARD_LIGHTNESS_SCALE[level];
  }
};
