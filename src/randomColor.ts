// randomColor.ts

import { oklchToHexPerceptual } from "./colorUtils";
import type { RandomColorConfig } from "./types";
import { DEFAULT_RANDOM_COLOR_CONFIG } from "./constants";

// =============================================================================
// Random Primary Color Generation Feature
// =============================================================================

/**
 * Generate random seed color
 * @param options Generation options
 * @returns HEX string
 */
export const generateRandomSeedColor = (
  randomColorConfig: RandomColorConfig = {}
): string => {
  const perfectConfig = {
    ...DEFAULT_RANDOM_COLOR_CONFIG,
    ...randomColorConfig,
  };

  // Generate random hue
  const [minHue, maxHue] = perfectConfig.hueRange;
  const hue = Math.random() * (maxHue - minHue) + minHue;

  // Generate random lightness
  const [minLightness, maxLightness] = perfectConfig.lightnessRange;
  const lightness =
    Math.random() * (maxLightness - minLightness) + minLightness;

  // Generate random chroma
  const [minChroma, maxChroma] = perfectConfig.chromaRange;
  const chromaValue = Math.random() * (maxChroma - minChroma) + minChroma;
  const chroma = chromaValue; // chromaValue is already in 0-1 range

  // Create OKLCH color with target values
  const targetOKLCH = {
    mode: "oklch" as const,
    l: lightness,
    c: chroma,
    h: hue,
  };

  // Use perceptual gamut mapping with HEX conversion
  return oklchToHexPerceptual(targetOKLCH);
};
