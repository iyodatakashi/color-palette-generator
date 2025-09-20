// lightness.ts

import * as culori from "culori";
import {
  adjustChromaForLightness,
  getTheoreticalChromaCoefficient,
  getPerceptualChroma,
} from "./chroma";
import {
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
  PERCEPTUAL_LIGHTNESS_SCALE,
  STANDARD_MAX_LIGHTNESS,
  STANDARD_MIN_LIGHTNESS,
  PERCEPTUAL_MAX_LIGHTNESS,
  PERCEPTUAL_MIN_LIGHTNESS,
  MAX_LEVEL,
  MIN_LEVEL,
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
  lightnessMethod = "perceptual",
}: {
  color: string;
  lightnessMethod?: LightnessMethod;
}): number => {
  // Convert color to OKLCH for lightness calculation
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
 * Adjust color to achieve specified lightness
 */
export const adjustToLightness = ({
  h,
  c,
  targetLightness,
  lightnessMethod = "perceptual",
  enableChromaAdjustment = true,
  baseLightness = 50,
  baseColor,
}: {
  h: number;
  c: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
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

  // Apply perceptual lightness adjustment
  return adjustToPerceptualLightness({
    h,
    c: adjustedChroma,
    targetLightness,
    baseColor,
  });
};

/**
 * Direct adjustment by perceptual lightness using OKLCH chroma preservation
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
    // Use actual base color's OKLCH for hue reference
    const baseColorObj = culori.parse(baseColor);
    originalOKLCH = culori.converter("oklch")(baseColorObj);
  }

  // Create new OKLCH with target lightness and provided chroma/hue
  const newOKLCH = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: c, // Use provided chroma
    h: originalOKLCH?.h || h, // Use base color hue if available, otherwise provided hue
  };

  // Convert back to RGB
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
  lightnessMethod = "perceptual",
}: {
  inputLightness: number;
  lightnessMethod?: LightnessMethod;
}): number => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  return SCALE_LEVELS.reduce((closestLevel, current) => {
    const lightness =
      lightnessMethod !== "perceptual"
        ? getAdjustedLightness({ level: current, lightnessMethod })
        : lightnessMethod === "perceptual"
        ? PERCEPTUAL_LIGHTNESS_SCALE[current]
        : STANDARD_LIGHTNESS_SCALE[current];

    const currentDiff = Math.abs(inputLightness - lightness);
    const closestDiff = Math.abs(
      inputLightness -
        (lightnessMethod !== "perceptual"
          ? getAdjustedLightness({ level: closestLevel, lightnessMethod })
          : lightnessMethod === "perceptual"
          ? PERCEPTUAL_LIGHTNESS_SCALE[closestLevel]
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
  lightnessMethod = "perceptual",
}: {
  inputLightness: number;
  baseLevel: number;
  lightnessMethod?: LightnessMethod;
}): Record<number, number> => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  // Use appropriate scale and limits based on lightness method
  const scale =
    lightnessMethod === "perceptual"
      ? PERCEPTUAL_LIGHTNESS_SCALE
      : STANDARD_LIGHTNESS_SCALE;

  const maxLightness =
    lightnessMethod === "perceptual"
      ? PERCEPTUAL_MAX_LIGHTNESS
      : STANDARD_MAX_LIGHTNESS;
  const minLightness =
    lightnessMethod === "perceptual"
      ? PERCEPTUAL_MIN_LIGHTNESS
      : STANDARD_MIN_LIGHTNESS;

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

  // For perceptual lightness, use PERCEPTUAL_LIGHTNESS_SCALE directly
  if (lightnessMethod === "perceptual") {
    SCALE_LEVELS.forEach((level) => {
      evenScale[level] = scale[level];
    });
    return evenScale;
  }

  // For other methods, use the original logic
  evenScale[baseLevel] = clampedInputLightness;

  // Upper levels (bright direction)
  for (let i = 1; i <= upwardSteps; i++) {
    const level = baseLevel - i * STEP_SIZE;
    const lightness = Math.min(
      clampedInputLightness + upwardInterval * i,
      maxLightness
    );
    evenScale[level] = lightness;
  }

  // Lower levels (dark direction)
  for (let i = 1; i <= downwardSteps; i++) {
    const level = baseLevel + i * STEP_SIZE;
    const lightness = Math.max(
      clampedInputLightness - downwardInterval * i,
      minLightness
    );
    evenScale[level] = lightness;
  }

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

  // Calculate lightness using perceptual scale
  return PERCEPTUAL_LIGHTNESS_SCALE[level];
};
