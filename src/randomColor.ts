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

/**
 * Generate random color within specific hue range
 * @param baseHue Base hue
 * @param range Hue range (±degrees)
 * @param options Other options
 * @returns HEX string
 */
export function generateRandomColorAroundHue(
  baseHue: number,
  range: number = 30,
  config: Omit<RandomColorConfig, "hueRange"> = {}
): string {
  const minHue = (baseHue - range + 360) % 360;
  const maxHue = (baseHue + range + 360) % 360;

  // Handle case where range crosses 0 degrees
  let hueRange: [number, number];
  if (minHue > maxHue) {
    // When crossing 0 degrees, randomly choose 0-maxHue or minHue-360
    const useUpperRange = Math.random() > 0.5;
    hueRange = useUpperRange ? [minHue, 360] : [0, maxHue];
  } else {
    hueRange = [minHue, maxHue];
  }

  return generateRandomPrimaryColor({
    ...config,
    hueRange,
  });
}
