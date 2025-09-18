// saturation.ts

import { hslToRGB, rgbToHSL, hexToRGB, rgbToOKLCH } from "./colorUtils";
import type { SaturationMethod, RGB } from "./types";

// =============================================================================
// Saturation Calculation Functions
// =============================================================================

/**
 * Get saturation value from color according to saturation calculation method
 */
export const getSaturation = ({
  color,
  saturationMethod = "perceptual",
}: {
  color: string;
  saturationMethod?: SaturationMethod;
}): number => {
  const rgb = hexToRGB(color);

  switch (saturationMethod) {
    case "hsl":
      return getHSLSaturation(rgb);
    case "perceptual":
    default:
      return getPerceptualSaturation(rgb);
  }
};

/**
 * Get HSL saturation
 */
const getHSLSaturation = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const hsl = rgbToHSL({ r, g, b });
  return hsl.s;
};

/**
 * Calculate perceptual saturation from RGB using OKLCH chroma
 */
export const getPerceptualSaturation = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const oklch = rgbToOKLCH({ r, g, b });

  // Normalize chroma to 0-100 scale
  // OKLCH chroma typically ranges from 0 to ~0.4
  return Math.min(100, (oklch.c / 0.4) * 100);
};

// =============================================================================
// Saturation Adjustment Functions
// =============================================================================

/**
 * Calculate theoretical saturation coefficient based on lightness
 * Returns a coefficient (0-1) representing how much saturation is naturally expected at given lightness
 */
export const getTheoreticalSaturationCoefficient = (
  lightness: number,
  hue: number = 0
): number => {
  // Normalize lightness to 0-1 range
  const normalizedL = Math.max(0, Math.min(100, lightness)) / 100;

  // Use parabolic curve with peak at 56% lightness (500 level)
  // Shift the curve so that 0.56 (56%) becomes the peak
  const shiftedL = normalizedL - 0.56;
  const baseCoeff = 1 - (shiftedL * shiftedL) / (0.56 * 0.56);

  // Apply steeper power curve for more pronounced peak
  let coefficient = Math.pow(Math.max(0, baseCoeff), 0.6);

  // Wider range for more dramatic saturation variation
  return Math.max(0.2, Math.min(1.2, coefficient));
};

/**
 * Adjust saturation based on lightness using OKLCH perceptual method
 */
export const adjustSaturationForLightness = ({
  h,
  s,
  baseLightness,
  targetLightness,
}: {
  h: number;
  s: number;
  baseLightness: number;
  targetLightness: number;
}): number => {
  // OKLCH perceptual method: use theoretical saturation curve based on lightness
  // Step 1: Get base color's perceptual saturation from HSL values
  const baseColor = hslToRGB({ h, s, l: baseLightness });
  const basePerceptualSat = getPerceptualSaturation(baseColor);

  // Step 2: Get current scale color's perceptual saturation (before adjustment)
  const currentColor = hslToRGB({ h, s, l: targetLightness });
  const currentPerceptualSat = getPerceptualSaturation(currentColor);

  // Step 3: Calculate baseline perceptual saturations for both lightness levels
  const baseLightnessCoeff = getTheoreticalSaturationCoefficient(
    baseLightness,
    h
  );
  const targetLightnessCoeff = getTheoreticalSaturationCoefficient(
    targetLightness,
    h
  );

  // Calculate theoretical perceptual saturations (not just coefficients)
  const baselinePerceptualSat = basePerceptualSat; // Base color's actual perceptual saturation

  // Calculate target saturation based on theoretical curve
  const targetBaselinePerceptualSat =
    baselinePerceptualSat * (targetLightnessCoeff / baseLightnessCoeff);

  // Apply saturation adjustment to normalize vividness across hues at same lightness level
  const saturationRatio =
    targetBaselinePerceptualSat / Math.max(currentPerceptualSat, 1);

  // Apply stronger correction to align with theoretical curve
  const blendRatio = 0.8; // Maximum adjustment for visible effect
  const adjustedSaturation =
    s * (1 - blendRatio + blendRatio * saturationRatio);

  // Keep reasonable bounds
  return Math.max(10, Math.min(95, adjustedSaturation));
};
