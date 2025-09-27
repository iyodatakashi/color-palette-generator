// hue.ts

import * as culori from "culori";
import { getLightness } from "./lightness";
import { generateSameToneColor } from "./combination";
import type { HuePaletteConfig, ColorConfig, Palette } from "./types";
import { generateColorPalette } from "./palette";
import type { Oklch } from "culori";
import { oklchToHexAdjustChroma } from "./colorUtils";

// =============================================================================
// Hue Change Functions
// =============================================================================

// =============================================================================
// Hue Palette Generation
// =============================================================================

/**
 * Named hue positions on the color wheel (24 divisions)
 */
export const HUE_NAMES = {
  0: "red",
  15: "scarlet",
  30: "orange",
  45: "amber",
  60: "yellow",
  75: "peridot",
  90: "lime",
  105: "sage",
  120: "green",
  135: "jade",
  150: "emerald",
  165: "turquoise",
  180: "cyan",
  195: "cerulean",
  210: "azure",
  225: "cobalt",
  240: "blue",
  255: "violet",
  270: "purple",
  285: "orchid",
  300: "magenta",
  315: "rose",
  330: "crimson",
  345: "ruby",
} as const;

/**
 * Generate complete color palettes for each hue division
 */
export const generateHuePalette = ({
  oklch,
  divisions = 24,
  hueShiftMode = "natural",
  includeTransparent = false,
  bgColorLight = "#ffffff",
  bgColorDark = "#000000",
  transparentOriginLevel = 500,
  includeTextColors = false,
}: HuePaletteConfig): Palette => {
  // Get base colors for each hue
  const baseColors = generateHueColors({ oklch, divisions });

  // Create ColorConfig array for all base colors
  const colorConfigs: ColorConfig[] = baseColors.map(({ name, oklch }) => ({
    id: name.toLowerCase(),
    prefix: name.toLowerCase(),
    seedColor: oklchToHexAdjustChroma(oklch),
    seedOklch: oklch,
    hueShiftMode,
    includeTransparent,
    bgColorLight,
    bgColorDark,
    transparentOriginLevel,
    includeTextColors,
  }));

  // Let generateColorPalette handle the palette generation
  return generateColorPalette(colorConfigs);
};

/**
 * Generate evenly spaced base colors for each hue division
 */
export const generateHueColors = ({
  oklch,
  divisions = 24,
}: {
  oklch: Oklch;
  divisions: number;
}): Array<{
  name: string;
  oklch: Oklch;
}> => {
  const hueStep = 360 / divisions;
  const colors: Array<{
    name: string;
    hue: number;
    oklch: Oklch;
  }> = [];

  for (let i = 0; i < divisions; i++) {
    const hue = i * hueStep;
    const normalizedHue = Math.round(hue);

    const adjustedColor = generateSameToneColor({
      h: hue,
      c: oklch.c || 0,
      targetLightness: oklch.l,
    });

    // Get name from predefined names or generate generic name
    const name =
      HUE_NAMES[normalizedHue as keyof typeof HUE_NAMES] ||
      `hue-${normalizedHue}`;

    colors.push({
      name,
      hue: normalizedHue,
      oklch: adjustedColor,
    });
  }

  return colors;
};
