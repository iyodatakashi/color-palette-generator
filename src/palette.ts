// palette.ts

import type { Palette, ColorConfig, HSL } from "./types";
import { hexToRGB, rgbToHSL, rgbToHex } from "./colorUtils";
import {
  getLightness,
  adjustToLightness,
  findClosestLevel,
  calculateEvenScale,
} from "./lightness";
import { calculateHueShift } from "./hueShift";
import { setTransparentPalette } from "./transparentColor";
import { createContextLogger } from "./logger";
import {
  SCALE_LEVELS,
  DEFAULT_LIGHTNESS_METHOD,
  DEFAULT_HUE_SHIFT_MODE,
} from "./constants";

const log = createContextLogger("Palette");

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Generate versatile color palette(s) from specified color(s)
 */
export const generateColorPalette = (
  input: ColorConfig | ColorConfig[]
): Palette => {
  // Handle multiple configurations
  if (Array.isArray(input)) {
    const allPalette: Palette = {};

    input.forEach((config) => {
      const palette = generateColorPalette(config);
      Object.assign(allPalette, palette);
    });

    return allPalette;
  }

  // Handle single configuration
  const colorConfig = input;
  const inputRGB = hexToRGB(colorConfig.color);
  const normalizedColor = rgbToHex(inputRGB);
  const inputHSL = rgbToHSL(inputRGB);

  // Detect invalid color input and log output
  if (
    inputRGB.r === 0 &&
    inputRGB.g === 0 &&
    inputRGB.b === 0 &&
    colorConfig.color !== "#000000"
  ) {
    log.warn("Invalid color input detected, using black fallback", {
      originalColor: colorConfig.color,
      fallbackColor: normalizedColor,
      prefix: colorConfig.prefix,
    });
  }

  const normalizedConfig: Required<ColorConfig> = {
    ...colorConfig,
    color: normalizedColor,
    lightnessMethod: colorConfig.lightnessMethod || DEFAULT_LIGHTNESS_METHOD,
    hueShiftMode: colorConfig.hueShiftMode || DEFAULT_HUE_SHIFT_MODE,
    includeTransparent: colorConfig.includeTransparent || false,
    includeTextColors: colorConfig.includeTextColors || false,
    bgColorLight: colorConfig.bgColorLight || "#ffffff",
    bgColorDark: colorConfig.bgColorDark || "#000000",
    transparentOriginLevel: colorConfig.transparentOriginLevel || 500,
  };

  const inputLightness = getLightness({
    color: normalizedColor,
    lightnessMethod: normalizedConfig.lightnessMethod,
  });

  const closestLevel = findClosestLevel({
    inputLightness,
    lightnessMethod: normalizedConfig.lightnessMethod,
  });

  const adjustedLightnessScale = calculateEvenScale({
    inputLightness,
    baseLevel: closestLevel,
  });

  const palette = generateOriginalPalette({
    colorConfig: normalizedConfig,
    inputHSL,
    closestLevel,
    adjustedLightnessScale,
  });

  setVariationColors({
    colorConfig: normalizedConfig,
    closestLevel,
    palette,
  });

  if (colorConfig.includeTransparent) {
    setTransparentPalette({
      palette,
      colorConfig: normalizedConfig,
    });
  }

  // Generate text colors last to ensure proper order
  setTextColor({
    colorConfig: normalizedConfig,
    inputColor: normalizedColor,
    palette,
  });

  return palette;
};

// =============================================================================
// Palette Generation Logic
// =============================================================================

/**
 * Generate basic color palette
 */
const generateOriginalPalette = ({
  colorConfig,
  inputHSL,
  closestLevel,
  adjustedLightnessScale,
}: {
  inputHSL: HSL;
  closestLevel: number;
  adjustedLightnessScale: Record<number, number>;
  colorConfig: Required<ColorConfig>;
}): Palette => {
  const palette: Palette = {};
  const originalLightness = adjustedLightnessScale[closestLevel];

  Object.entries(adjustedLightnessScale).forEach(([key, targetLightness]) => {
    if (parseInt(key) === closestLevel) {
      palette[`--${colorConfig.prefix}-${key}`] = colorConfig.color;
    } else {
      const adjustedHue = calculateHueShift({
        baseHue: inputHSL.h,
        baseLightness: originalLightness,
        targetLightness,
        adjustedLightnessScale,
        hueShiftMode: colorConfig.hueShiftMode,
      });

      const generatedColor = adjustToLightness({
        h: adjustedHue,
        s: inputHSL.s,
        targetLightness,
        lightnessMethod: colorConfig.lightnessMethod,
      });

      palette[`--${colorConfig.prefix}-${key}`] = generatedColor;
    }
  });

  return palette;
};

/**
 * Set Variation Colors
 */
const setVariationColors = ({
  colorConfig,
  closestLevel,
  palette,
}: {
  colorConfig: Required<ColorConfig>;
  closestLevel: number;
  palette: Palette;
}): void => {
  palette[
    `--${colorConfig.prefix}-color`
  ] = `var(--${colorConfig.prefix}-${closestLevel})`;

  const currentIndex = SCALE_LEVELS.indexOf(closestLevel);

  const variations = [
    { name: "lighter", offset: -2 },
    { name: "light", offset: -1 },
    { name: "dark", offset: 1 },
    { name: "darker", offset: 2 },
  ];

  variations.forEach(({ name, offset }) => {
    const targetIndex = Math.max(
      0,
      Math.min(SCALE_LEVELS.length - 1, currentIndex + offset)
    );
    const targetLevel = SCALE_LEVELS[targetIndex];
    palette[
      `--${colorConfig.prefix}-${name}`
    ] = `var(--${colorConfig.prefix}-${targetLevel})`;
  });
};

/**
 * Set Text Color
 * Generate appropriate text colors for both light and dark backgrounds
 * Only generate text colors if includeTextColors is enabled
 */
const setTextColor = ({
  colorConfig,
  inputColor,
  palette,
}: {
  colorConfig: Required<ColorConfig>;
  inputColor: string;
  palette: Palette;
}): void => {
  // Only generate text colors if includeTextColors is enabled
  if (!colorConfig.includeTextColors) {
    return;
  }

  const inputRGB = hexToRGB(inputColor);
  const normalizedColor = rgbToHex(inputRGB);
  const inputPerceptualLightness = getLightness({
    color: normalizedColor,
    lightnessMethod: "perceptual",
  });

  // Find the primary color level (the level closest to input color)
  const primaryLevel = findClosestLevel({
    inputLightness: inputPerceptualLightness,
    lightnessMethod: colorConfig.lightnessMethod,
  });

  // Get primary color and its lightness
  const primaryColor = palette[`--${colorConfig.prefix}-${primaryLevel}`];
  if (!primaryColor) {
    return;
  }

  const primaryLightness = getLightness({
    color: primaryColor,
    lightnessMethod: "perceptual",
  });

  // Find text color for light background (dark text on light background)
  const textColorForLightBackground = findTextColorLevel({
    primaryLevel,
    primaryLightness,
    palette,
    prefix: colorConfig.prefix,
    targetLightness: 60,
    isLighter: false, // Find darker color
  });

  // Find text color for dark background (light text on dark background)
  const textColorForDarkBackground = findTextColorLevel({
    primaryLevel,
    primaryLightness,
    palette,
    prefix: colorConfig.prefix,
    targetLightness: 50,
    isLighter: true, // Find lighter color
  });

  // Set light theme text color (dark text on light background)
  palette[
    `--${colorConfig.prefix}-text-color-on-light`
  ] = `var(--${colorConfig.prefix}-${textColorForLightBackground})`;

  // Set dark theme text color (light text on dark background)
  palette[
    `--${colorConfig.prefix}-text-color-on-dark`
  ] = `var(--${colorConfig.prefix}-${textColorForDarkBackground})`;
};

/**
 * Find appropriate text color level based on lightness criteria
 */
const findTextColorLevel = ({
  primaryLevel,
  primaryLightness,
  palette,
  prefix,
  targetLightness,
  isLighter,
}: {
  primaryLevel: number;
  primaryLightness: number;
  palette: Palette;
  prefix: string;
  targetLightness: number;
  isLighter: boolean;
}): number => {
  // Check if primary color meets the criteria
  const meetsCriteria = isLighter
    ? primaryLightness >= targetLightness
    : primaryLightness <= targetLightness;

  if (meetsCriteria) {
    return primaryLevel;
  }

  // Search for appropriate color level
  const primaryIndex = SCALE_LEVELS.indexOf(primaryLevel);
  const startIndex = isLighter ? primaryIndex - 1 : primaryIndex + 1;
  const endIndex = isLighter ? 0 : SCALE_LEVELS.length;
  const step = isLighter ? -1 : 1;

  for (
    let i = startIndex;
    isLighter ? i >= endIndex : i < endIndex;
    i += step
  ) {
    const level = SCALE_LEVELS[i];
    const levelColor = palette[`--${prefix}-${level}`];
    if (levelColor) {
      const levelLightness = getLightness({
        color: levelColor,
        lightnessMethod: "perceptual",
      });
      const levelMeetsCriteria = isLighter
        ? levelLightness >= targetLightness
        : levelLightness <= targetLightness;

      if (levelMeetsCriteria) {
        return level;
      }
    }
  }

  // Fallback to extreme level
  return isLighter ? 50 : 950;
};
