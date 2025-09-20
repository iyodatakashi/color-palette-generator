// saturation.ts

import * as culori from "culori";
import { STANDARD_LIGHTNESS_SCALE } from "./constants";
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
  const colorObj = culori.parse(color);
  if (!colorObj) return 0;

  const rgb = culori.converter("rgb")(colorObj);
  if (!rgb) return 0;

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
  const rgbObj = { mode: "rgb" as const, r: r / 255, g: g / 255, b: b / 255 };
  const hslColor = culori.converter("hsl")(rgbObj);
  const hsl = {
    h: hslColor.h || 0,
    s: (hslColor.s || 0) * 100,
    l: (hslColor.l || 0) * 100,
  };
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
  const rgbObj = { mode: "rgb" as const, r: r / 255, g: g / 255, b: b / 255 };
  const oklch = culori.converter("oklch")(rgbObj);

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

  // Define smooth saturation curve: peak at 56% lightness (500 level), lower at extremes
  // Use a smooth curve that reduces saturation at both ends
  let coefficient;

  if (normalizedL <= 0.56) {
    // For lightness <= 56%, use a curve that peaks at 56% and reduces towards 0%
    coefficient = Math.pow(normalizedL / 0.56, 0.8);
  } else {
    // For lightness > 56%, use a curve that reduces towards 100%
    coefficient = Math.pow((1 - normalizedL) / (1 - 0.56), 0.8);
  }

  // Apply additional reduction for extreme lightness levels
  const extremeReduction =
    Math.pow(Math.min(normalizedL, 1 - normalizedL) * 2, 2) * 0.3;
  coefficient = coefficient * (1 - extremeReduction);

  // Ensure reasonable bounds
  return Math.max(0.1, Math.min(1.0, coefficient));
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
  // Step 1: Define saturation curve (peak at 500 level)
  const getSaturationCurve = (lightness: number): number => {
    const normalizedL = Math.max(0, Math.min(100, lightness)) / 100;

    // Get the peak lightness value from STANDARD_LIGHTNESS_SCALE
    const peakLightness = STANDARD_LIGHTNESS_SCALE[500] / 100; // Convert to 0-1 range

    // Smooth curve: peak at 500 level lightness
    // Use a smooth curve that peaks at the 500 level lightness and falls to 0.3 at extremes
    const distanceFromPeak = Math.abs(normalizedL - peakLightness);
    const maxDistance = peakLightness; // Distance from peak to extreme (0 or 1)

    // Use quadratic curve for smooth falloff
    const normalizedDistance = distanceFromPeak / maxDistance;
    const curveValue = 1.0 - Math.pow(normalizedDistance, 2) * 0.5; // Less aggressive falloff

    return Math.max(0.6, Math.min(1.0, curveValue));
  };

  // Step 2: Calculate correction factor from base color
  const baseCurveValue = getSaturationCurve(baseLightness);
  const correctionFactor = s / baseCurveValue;

  // Step 3: Calculate target saturation directly from target lightness
  const targetCurveValue = getSaturationCurve(targetLightness);
  const targetSaturation = targetCurveValue * correctionFactor;

  // Keep reasonable bounds
  return Math.max(10, Math.min(95, targetSaturation));
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
  const rgbObj = { mode: "rgb" as const, r: r / 255, g: g / 255, b: b / 255 };
  const hslColor = culori.converter("hsl")(rgbObj);
  const hsl = {
    h: hslColor.h || 0,
    s: (hslColor.s || 0) * 100,
    l: (hslColor.l || 0) * 100,
  };
  // Weighted average of perceptual saturation and HSL saturation
  return perceptual * 0.4 + hsl.s * 0.6;
};
