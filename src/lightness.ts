// lightness.ts

import * as culori from "culori";
import { adjustChromaForLightness } from "./chroma";
import {
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
  MAX_LIGHTNESS,
  MIN_LIGHTNESS,
  MAX_LEVEL,
  MIN_LEVEL,
} from "./constants";

// =============================================================================
// Lightness Calculation Functions
// =============================================================================

/**
 * Get lightness value from color using OKLCH
 */
export const getLightness = (color: string): number => {
  const colorObj = culori.parse(color);
  if (!colorObj) return 0;

  const oklch = culori.converter("oklch")(colorObj);
  if (!oklch) return 0;

  // OKLCH lightness is 0-1, convert to 0-100 scale
  return oklch.l * 100;
};

// =============================================================================
// Lightness Adjustment Functions
// =============================================================================

/**
 * Adjust color to achieve specified lightness with optional chroma adjustment
 */
export const adjustToLightness = ({
  h,
  c,
  targetLightness,
  enableChromaAdjustment = true,
  baseLightness = 50,
  baseColor,
}: {
  h: number;
  c: number;
  targetLightness: number;
  enableChromaAdjustment?: boolean;
  baseLightness?: number;
  baseColor?: string;
}): string => {
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  c = isFinite(c) ? Math.max(0, c) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 50;
  baseLightness = isFinite(baseLightness) ? baseLightness : 50;

  // Adjust chroma based on lightness change if enabled
  const adjustedChroma = enableChromaAdjustment
    ? adjustChromaForLightness({
        h,
        s: c * 100, // Convert chroma to saturation-like scale for compatibility
        baseLightness,
        targetLightness,
      }) / 100 // Convert back to chroma scale
    : c;

  return adjustToPerceptualLightness({
    h,
    c: adjustedChroma,
    targetLightness,
    baseColor,
  });
};

/**
 * Create color with target lightness using OKLCH
 */
export const adjustToPerceptualLightness = ({
  h,
  c,
  targetLightness,
  baseColor,
}: {
  h: number;
  c: number;
  targetLightness: number;
  baseColor?: string;
}): string => {
  let originalOKLCH;

  if (baseColor) {
    const baseColorObj = culori.parse(baseColor);
    originalOKLCH = culori.converter("oklch")(baseColorObj);
  }

  // Create OKLCH with target lightness
  const newOKLCH = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: c,
    h: originalOKLCH?.h || h,
  };

  const newRGB = culori.converter("rgb")(newOKLCH);
  return culori.formatHex(newRGB);
};

// =============================================================================
// Scale Generation Functions
// =============================================================================

/**
 * Find the closest lightness level to the specified color
 */
export const findClosestLevel = ({
  inputLightness,
}: {
  inputLightness: number;
}): number => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  return SCALE_LEVELS.reduce((closestLevel, current) => {
    const lightness = STANDARD_LIGHTNESS_SCALE[current];

    const currentDiff = Math.abs(inputLightness - lightness);
    const closestDiff = Math.abs(
      inputLightness - STANDARD_LIGHTNESS_SCALE[closestLevel]
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

  // Use perceptual scale and limits
  const scale = STANDARD_LIGHTNESS_SCALE;
  const maxLightness = MAX_LIGHTNESS;
  const minLightness = MIN_LIGHTNESS;

  const clampedInputLightness = Math.max(
    minLightness,
    Math.min(maxLightness, inputLightness)
  );

  if (!SCALE_LEVELS.includes(baseLevel)) baseLevel = 500;

  const STEP_SIZE = 50;
  const baseIndex = (baseLevel - MIN_LEVEL) / STEP_SIZE;
  const totalSteps = (MAX_LEVEL - MIN_LEVEL) / STEP_SIZE;

  const upwardSteps = baseIndex;
  const downwardSteps = totalSteps - baseIndex;

  const availableUpward = maxLightness - clampedInputLightness;
  const availableDownward = clampedInputLightness - minLightness;

  const upwardInterval = upwardSteps > 0 ? availableUpward / upwardSteps : 0;
  const downwardInterval =
    downwardSteps > 0 ? availableDownward / downwardSteps : 0;

  const evenScale: Record<number, number> = {};

  // Use STANDARD_LIGHTNESS_SCALE directly
  SCALE_LEVELS.forEach((level) => {
    evenScale[level] = scale[level];
  });

  // Return clamped results
  const adjustedLightnessScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    if (evenScale[level] !== undefined) {
      adjustedLightnessScale[level] = Math.max(
        minLightness,
        Math.min(maxLightness, evenScale[level])
      );
    }
  });

  return adjustedLightnessScale;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get adjusted lightness using perceptual scale
 */
const getAdjustedLightness = ({ level }: { level: number }): number => {
  return STANDARD_LIGHTNESS_SCALE[level];
};
