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

  // Generate random chroma (convert saturation range to chroma range)
  const [minSat, maxSat] = perfectConfig.saturationRange;
  const saturation = Math.random() * (maxSat - minSat) + minSat;
  const chroma = saturation / 100; // Convert saturation percentage to chroma (0-1 range)

  // Adjust to specified lightness and return HEX string
  return adjustToLightness({
    h: hue,
    c: chroma,
    targetLightness: lightness,
    lightnessMethod: perfectConfig.lightnessMethod,
    enableSaturationAdjustment: false, // Keep original chroma for random color generation
  });
}
