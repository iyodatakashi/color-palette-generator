// randomColor.ts

import { adjustToLightness } from "./lightness";
import type { RandomColorConfig } from "./types";
import { DEFAULT_RANDOM_COLOR_CONFIG } from "./constants";

// =============================================================================
// Random Primary Color Generation Feature
// =============================================================================

/**
 * Generate random primary color
 * @param options Generation options
 * @returns HEX string
 */
export function generateRandomPrimaryColor(
  config: RandomColorConfig = {}
): string {
  const perfectConfig = { ...DEFAULT_RANDOM_COLOR_CONFIG, ...config };

  // Generate random hue
  const [minHue, maxHue] = perfectConfig.hueRange;
  const hue = Math.random() * (maxHue - minHue) + minHue;

  // Generate random lightness
  const [minLightness, maxLightness] = perfectConfig.lightnessRange;
  const lightness =
    Math.random() * (maxLightness - minLightness) + minLightness;

  // Generate random saturation
  const [minSat, maxSat] = perfectConfig.saturationRange;
  const saturation = Math.random() * (maxSat - minSat) + minSat;

  // Adjust to specified lightness and return HEX string
  return adjustToLightness({
    h: hue,
    s: saturation,
    targetLightness: lightness,
    lightnessMethod: perfectConfig.lightnessMethod,
  });
}
