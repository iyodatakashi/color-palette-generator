// saturation.ts

import {
  hslToRGB,
  rgbToHSL,
  hexToRGB,
  rgbToOKLAB,
  getPerceptualChroma,
} from "./colorUtils";
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
 * Calculate perceptual saturation from RGB using OKLAB chroma
 */
const getPerceptualSaturation = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const oklab = rgbToOKLAB({ r, g, b });
  const chroma = getPerceptualChroma({ a: oklab.a, b: oklab.b });

  // Normalize chroma to 0-100 scale
  // OKLAB chroma typically ranges from 0 to ~0.4
  return Math.min(100, (chroma / 0.4) * 100);
};

// =============================================================================
// Saturation Adjustment Functions
// =============================================================================

/**
 * Calculate theoretical saturation coefficient based on lightness
 * Returns a coefficient (0-1) representing how much saturation is naturally expected at given lightness
 */
const getTheoreticalSaturationCoefficient = (lightness: number): number => {
  // Normalize lightness to 0-1 range
  const normalizedL = Math.max(0, Math.min(100, lightness)) / 100;

  // Use parabolic curve: peaks at 50% lightness, decreases towards extremes
  const baseCoeff = 4 * normalizedL * (1 - normalizedL);

  // Apply power curve to make it gentler at the ends
  const coefficient = Math.pow(baseCoeff, 1.2);

  // Ensure minimum threshold for very dark/light colors
  return Math.max(0.15, coefficient);
};

/**
 * Adjust saturation based on lightness using OKLAB perceptual method
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
  // OKLAB perceptual method: use theoretical saturation curve based on lightness
  // Step 1: Get base color's perceptual saturation from HSL values
  const baseColor = hslToRGB({ h, s, l: baseLightness });
  const basePerceptualSat = getPerceptualSaturation(baseColor);

  // Step 2: Get current scale color's perceptual saturation (before adjustment)
  const currentColor = hslToRGB({ h, s, l: targetLightness });
  const currentPerceptualSat = getPerceptualSaturation(currentColor);

  // Step 3: Calculate baseline perceptual saturations for both lightness levels
  const baseLightnessCoeff = getTheoreticalSaturationCoefficient(baseLightness);
  const targetLightnessCoeff =
    getTheoreticalSaturationCoefficient(targetLightness);

  // Calculate theoretical perceptual saturations (not just coefficients)
  const baselinePerceptualSat = basePerceptualSat; // Base color's actual perceptual saturation
  const targetBaselinePerceptualSat =
    baselinePerceptualSat * (targetLightnessCoeff / baseLightnessCoeff);

  // Apply correction: adjust current perceptual saturation toward target baseline
  const saturationRatio =
    targetBaselinePerceptualSat / Math.max(currentPerceptualSat, 1);
  const adjustedSaturation = s * saturationRatio;

  // Ensure saturation stays within reasonable bounds
  return Math.max(15, Math.min(95, adjustedSaturation));
};
