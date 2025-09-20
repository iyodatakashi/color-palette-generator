// hue.ts

import * as culori from "culori";
import { getLightness, adjustToLightness } from "./lightness";
import type { HuePaletteConfig, ColorConfig, Palette } from "./types";
import { generateColorPalette } from "./palette";

// =============================================================================
// Hue Change Functions
// =============================================================================

/**
 * Adjust color hue while maintaining the same tone (chroma/lightness)
 */
export const adjustColorToSameTone = ({
  color,
  targetHue,
}: {
  color: string;
  targetHue: number;
}): string => {
  // Normalize target hue to 0-360 range
  targetHue = isFinite(targetHue) ? ((targetHue % 360) + 360) % 360 : 0;

  // Parse input color
  const colorObj = culori.parse(color);
  if (!colorObj) {
    // Fallback for invalid color
    return color;
  }

  // Calculate perceived lightness of original color
  const originalPerceivedLightness = getLightness(color);

  // Get OKLCH values from original color
  const originalOKLCH = culori.converter("oklch")(colorObj);
  if (!originalOKLCH) {
    return color; // Fallback for conversion failure
  }

  // Create new color with target hue, preserving lightness and chroma
  // culori uses radians for OKLCH hue
  const newOKLCH = {
    mode: "oklch" as const,
    l: originalPerceivedLightness / 100, // Convert to 0-1 range
    c: originalOKLCH.c, // Preserve original chroma
    h: targetHue, // Use target hue in degrees (culori uses degrees for OKLCH)
  };

  // Convert OKLCH to HEX color
  const newRGB = culori.converter("rgb")(newOKLCH);
  if (!newRGB) {
    return color; // Fallback for conversion failure
  }

  return culori.formatHex(newRGB);
};

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
  color,
  divisions = 24,
  hueShiftMode = "natural",
  includeTransparent = false,
  bgColorLight = "#ffffff",
  bgColorDark = "#000000",
  transparentOriginLevel = 500,
  includeTextColors = false,
}: HuePaletteConfig): Palette => {
  // Get base colors for each hue
  const baseColors = generateHueColors({ color, divisions });

  // Create ColorConfig array for all base colors
  const colorConfigs: ColorConfig[] = baseColors.map(({ name, color }) => ({
    id: name.toLowerCase(),
    prefix: name.toLowerCase(),
    color,
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
  color,
  divisions = 24,
}: Pick<HuePaletteConfig, "color" | "divisions">): Array<{
  name: string;
  hue: number;
  color: string;
}> => {
  const parsedColor = culori.parse(color);
  if (!parsedColor) {
    return [];
  }

  const hueStep = 360 / divisions;
  const colors: Array<{
    name: string;
    hue: number;
    color: string;
  }> = [];

  for (let i = 0; i < divisions; i++) {
    const hue = i * hueStep;
    const normalizedHue = Math.round(hue);

    const adjustedColor = adjustColorToSameTone({
      color,
      targetHue: hue,
    });

    // Get name from predefined names or generate generic name
    const name =
      HUE_NAMES[normalizedHue as keyof typeof HUE_NAMES] ||
      `hue-${normalizedHue}`;

    colors.push({
      name,
      hue: normalizedHue,
      color: adjustedColor,
    });
  }

  return colors;
};
