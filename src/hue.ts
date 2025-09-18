// hue.ts

import { hexToHSL, validateHexColor, hexToRGB, rgbToOKLCH } from "./colorUtils";
import {
  getLightness,
  adjustToLightness,
  adjustToHybridLightness,
  adjustToPerceptualLightness,
  adjustToHSLLightness,
  getHybridLightness,
} from "./lightness";
import { getHybridSaturation } from "./saturation";
import type {
  LightnessMethod,
  HuePaletteConfig,
  ColorConfig,
  Palette,
} from "./types";
import { generateColorPalette } from "./palette";

// =============================================================================
// Hue Change Functions
// =============================================================================

/**
 * Adjust color hue while maintaining the same tone (saturation/lightness)
 */
export const adjustColorToSameTone = ({
  color,
  targetHue,
  lightnessMethod = "hybrid",
}: {
  color: string;
  targetHue: number;
  lightnessMethod?: LightnessMethod;
}): string => {
  // Normalize target hue to 0-360 range
  targetHue = isFinite(targetHue) ? ((targetHue % 360) + 360) % 360 : 0;

  // Check if the color is valid
  if (!validateHexColor(color)) {
    // Fallback for invalid color
    return color;
  }

  // Convert input color to HSL
  const hsl = hexToHSL(color);

  // Calculate perceived lightness of original color using specified method
  const originalPerceivedLightness = getLightness({
    color: color,
    lightnessMethod,
  });

  // Use the same lightness method as specified to maintain consistency
  switch (lightnessMethod) {
    case "hsl":
      return adjustToHSLLightness({
        h: targetHue,
        s: hsl.s,
        targetLightness: originalPerceivedLightness,
      });
    case "perceptual":
      return adjustToPerceptualLightness({
        h: targetHue,
        s: hsl.s,
        targetLightness: originalPerceivedLightness,
      });
    case "hybrid":
    default:
      const originalRGB = hexToRGB(color);
      const originalHybridLightness = getHybridLightness(originalRGB);
      return adjustToHybridLightness({
        h: targetHue,
        s: hsl.s,
        targetLightness: originalHybridLightness,
      });
  }
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
  lightnessMethod = "hybrid",
  hueShiftMode = "natural",
  includeTransparent = false,
  bgColorLight = "#ffffff",
  bgColorDark = "#000000",
  transparentOriginLevel = 500,
  includeTextColors = false,
}: HuePaletteConfig): Palette => {
  // Get base colors for each hue
  const baseColors = generateHueColors({ color, divisions, lightnessMethod });

  // Create ColorConfig array for all base colors
  const colorConfigs: ColorConfig[] = baseColors.map(({ name, color }) => ({
    id: name.toLowerCase(),
    prefix: name.toLowerCase(),
    color,
    lightnessMethod,
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
  lightnessMethod = "hybrid",
}: Pick<HuePaletteConfig, "color" | "divisions" | "lightnessMethod">): Array<{
  name: string;
  hue: number;
  color: string;
}> => {
  if (!validateHexColor(color)) {
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
      lightnessMethod,
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
