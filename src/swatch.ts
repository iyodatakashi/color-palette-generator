// swatch.ts
//
// Generate complete color palettes across the entire hue spectrum.
// Useful for creating color pickers, visualizing color relationships,
// or generating comprehensive design systems.

import type { SwatchConfig, ColorConfig } from "./types";
import type { Oklch } from "culori";
import {
  oklchToHexAdjustChroma,
  normalizeOklch,
  hexToOklch,
  isValidOklch,
} from "./colorUtils";
import { SWATCH_NAMES } from "./constants";

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
 * // Result: { "--red-50": "...", "--red-100": "...", ..., "--ruby-950": "..." }
 */
export const generateSwatch = (swatchConfig: SwatchConfig): ColorConfig[] => {
  // Generate base colors for each hue division
  const seeds = getSwatchSeeds(swatchConfig);

  // Create ColorConfig for each hue to generate full palettes
  const colorConfigs: ColorConfig[] = seeds.map((seed) => ({
    id: seed.id,
    prefix: seed.prefix,
    seedColor: oklchToHexAdjustChroma(seed.oklch),
    seedOklch: seed.oklch,
    originLevel: 500,
    hueShiftMode: swatchConfig.hueShiftMode,
    includeTransparent: swatchConfig.includeTransparent,
    includeTextColors: swatchConfig.includeTextColors,
    bgColorLight: swatchConfig.bgColorLight,
    bgColorDark: swatchConfig.bgColorDark,
    transparentOriginLevel: swatchConfig.transparentOriginLevel,
    enableLightnessAdjustment: true,
    enableChromaAdjustment: true,
    enableChromaLimit: true,
    maxChroma: 0.2,
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
  id: string;
  prefix: string;
  oklch: Oklch;
}> => {
  const seedOklch = hexToOklch(swatchConfig.seedColor);
  if (!isValidOklch(seedOklch)) {
    throw Error("Invalid OKLCH");
  }

  const divisions = swatchConfig.divisions ?? 24;

  const hueStep = 360 / divisions;
  const colors: Array<{
    id: string;
    prefix: string;
    hue: number;
    oklch: Oklch;
  }> = [];

  for (let i = 0; i < divisions; i++) {
    const hue = i * hueStep;
    const normalizedHue = Math.round(hue);

    // Create OKLCH color with new hue, preserving lightness and chroma
    const oklch = normalizeOklch({
      mode: "oklch" as const,
      l: seedOklch.l,
      c: seedOklch.c || 0,
      h: hue,
    });

    // Get name from predefined names or generate generic name
    const swatchName = SWATCH_NAMES.find(
      (item) => item.degree === normalizedHue
    );
    const id = swatchName?.prefix || `swatch-${normalizedHue}`;

    colors.push({
      id,
      prefix: id,
      hue: normalizedHue,
      oklch,
    });
  }

  return colors;
};
