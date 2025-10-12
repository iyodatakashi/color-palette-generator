// swatch.ts
//
// Generate complete color palettes across the entire hue spectrum.
// Useful for creating color pickers, visualizing color relationships,
// or generating comprehensive design systems.

import type { SwatchConfig, ColorConfig } from "./types";
import type { Oklch } from "culori";
import { oklchToHexAdjustChroma, normalizeOklch } from "./colorUtils";
import {
  SWATCH_NAMES,
  DEFAULT_COLOR_CONFIG,
  DEFAULT_LEVEL_500_LIGHTNESS,
  DEFAULT_SWATCH_CONFIG,
} from "./constants";

// =============================================================================
// Swatch Palette Generation
// =============================================================================

/**
 * Generate complete color palettes for each hue division
 *
 * Creates full palettes (50-950 levels) for evenly spaced hues across
 * the color wheel. Useful for creating comprehensive color systems or
 * visualizing all available hues at consistent lightness and chroma.
 *
 * @param seedOklch - Base OKLCH color defining lightness and chroma
 * @param originLevel - Reference level for each hue (default: 500)
 * @param divisions - Number of hue divisions (default: 24, i.e., every 15°)
 * @param hueShiftMode - Hue shift behavior for palette generation
 * @param includeTransparent - Include transparent color variants
 * @param bgColorLight - Background color for light transparent variants
 * @param bgColorDark - Background color for dark transparent variants
 * @param transparentOriginLevel - Reference level for transparent colors
 * @param includeTextColors - Include text color variants
 * @returns Palette object with all hue-based palettes
 *
 * @example
 * const palette = generateSwatch({
 *   seedColor: #ff0000,
 *   originLevel: 500,
 *   divisions: 24,
 * });
 * // Result: { "--red-50": "...", "--red-100": "...", ..., "--red-950": "..." }
 */
export const generateSwatch = (swatchConfig: SwatchConfig): ColorConfig[] => {
  // Generate base colors for each hue division
  const seeds = getSwatchSeeds(swatchConfig);

  // Create ColorConfig for each hue to generate full palettes
  const colorConfigs: ColorConfig[] = seeds.map((seed) => ({
    id: seed.prefix,
    prefix: seed.prefix,
    seedColor: oklchToHexAdjustChroma(seed.oklch),
    seedOklch: seed.oklch,
    originLevel: swatchConfig.originLevel ?? DEFAULT_SWATCH_CONFIG.originLevel!,
    hueShiftMode:
      swatchConfig.hueShiftMode ?? DEFAULT_SWATCH_CONFIG.hueShiftMode,
    includeTransparent:
      swatchConfig.includeTransparent ??
      DEFAULT_SWATCH_CONFIG.includeTransparent,
    includeTextColors:
      swatchConfig.includeTextColors ?? DEFAULT_SWATCH_CONFIG.includeTextColors,
    bgColorLight:
      swatchConfig.bgColorLight ?? DEFAULT_SWATCH_CONFIG.bgColorLight,
    bgColorDark: swatchConfig.bgColorDark ?? DEFAULT_SWATCH_CONFIG.bgColorDark,
    transparentOriginLevel:
      swatchConfig.transparentOriginLevel ??
      DEFAULT_SWATCH_CONFIG.transparentOriginLevel,
    enableLightnessAdjustment:
      swatchConfig.enableLightnessAdjustment ??
      DEFAULT_COLOR_CONFIG.enableLightnessAdjustment,
    enableChromaAdjustment:
      swatchConfig.enableChromaAdjustment ??
      DEFAULT_COLOR_CONFIG.enableChromaAdjustment,
    enableChromaLimit:
      swatchConfig.enableChromaLimit ?? DEFAULT_SWATCH_CONFIG.enableChromaLimit,
    maxChroma: swatchConfig.maxChroma ?? DEFAULT_SWATCH_CONFIG.maxChroma,
  }));

  return colorConfigs;
};

/**
 * Generate evenly spaced base colors for each hue division
 *
 * @param seedOklch - Base OKLCH color (lightness and chroma will be preserved)
 * @param divisions - Number of hue divisions (default: 24)
 * @returns Array of named colors with their OKLCH values
 */
export const getSwatchSeeds = (
  swatchConfig: SwatchConfig
): Array<{
  prefix: string;
  oklch: Oklch;
}> => {
  const colors: Array<{
    prefix: string;
    oklch: Oklch;
  }> = [];

  SWATCH_NAMES.forEach((swatchName) => {
    const hue = swatchName.hue;
    const normalizedHue = Math.round(hue);

    // Create OKLCH color with new hue, preserving lightness and chroma
    const oklch = normalizeOklch({
      mode: "oklch" as const,
      l: DEFAULT_LEVEL_500_LIGHTNESS,
      c: swatchConfig.seedChroma,
      h: hue,
    });

    // Get name from predefined names or generate generic name
    const id = swatchName?.prefix || `swatch-${normalizedHue}`;

    colors.push({
      prefix: id,
      oklch,
    });
  });

  return colors;
};
