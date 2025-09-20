// palette.ts

import type { ColorConfig, NormalizedColorConfig, Palette } from "./types";
import type { Oklch } from "culori";
import * as culori from "culori";
import {
  getLightness,
  adjustToLightness,
  findClosestLevel,
  calculateEvenScale,
} from "./lightness";
import { calculateHueShift } from "./hueShift";
import { setTransparentPalette } from "./transparentColor";
import { createContextLogger } from "./logger";
import { DEFAULT_COLOR_CONFIG, SCALE_LEVELS } from "./constants";

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
  // Parse input color
  const inputColorObj = culori.parse(colorConfig.color);
  if (!inputColorObj) {
    throw new Error("Invalid input color");
  }

  const inputRGB = culori.converter("rgb")(inputColorObj);
  if (!inputRGB) {
    throw new Error("Failed to convert color to RGB");
  }

  const normalizedColor = culori.formatHex(inputColorObj);
  const inputOKLCH = culori.converter("oklch")(inputColorObj);
  if (!inputOKLCH) {
    throw new Error("Failed to convert color to OKLCH");
  }

  // Log color normalization for debugging
  if (colorConfig.color !== normalizedColor) {
    log.info("Color normalized", {
      originalColor: colorConfig.color,
      normalizedColor: normalizedColor,
      prefix: colorConfig.prefix,
    });
  }

  const normalizedConfig: NormalizedColorConfig = {
    ...colorConfig,
    color: normalizedColor,
    hueShiftMode: colorConfig.hueShiftMode || DEFAULT_COLOR_CONFIG.hueShiftMode,
    includeTransparent:
      colorConfig.includeTransparent ?? DEFAULT_COLOR_CONFIG.includeTransparent,
    includeTextColors:
      colorConfig.includeTextColors ?? DEFAULT_COLOR_CONFIG.includeTextColors,
    bgColorLight: colorConfig.bgColorLight || DEFAULT_COLOR_CONFIG.bgColorLight,
    bgColorDark: colorConfig.bgColorDark || DEFAULT_COLOR_CONFIG.bgColorDark,
    transparentOriginLevel:
      colorConfig.transparentOriginLevel ||
      DEFAULT_COLOR_CONFIG.transparentOriginLevel,
    enableChromaAdjustment:
      colorConfig.enableChromaAdjustment ??
      DEFAULT_COLOR_CONFIG.enableChromaAdjustment,
  };

  const inputLightness = getLightness(normalizedColor);

  const closestLevel = findClosestLevel({
    inputLightness,
    inputChroma: inputOKLCH.c,
    inputHue: inputOKLCH.h,
  });

  const adjustedLightnessScale = calculateEvenScale({
    inputLightness,
    inputChroma: inputOKLCH.c || 0,
    inputHue: inputOKLCH.h || 0,
  });

  const palette = generateOriginalPalette({
    colorConfig: normalizedConfig,
    inputOKLCH,
    closestLevel,
    adjustedLightnessScale,
    inputLightness,
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
  inputOKLCH,
  closestLevel,
  adjustedLightnessScale,
  inputLightness,
}: {
  inputOKLCH: Oklch;
  closestLevel: number;
  adjustedLightnessScale: Record<number, number>;
  colorConfig: NormalizedColorConfig;
  inputLightness: number;
}): Palette => {
  const palette: Palette = {};
  const originalLightness = inputLightness; // Use original input lightness, not adjusted scale value

  Object.entries(adjustedLightnessScale).forEach(([key, targetLightness]) => {
    const level = parseInt(key);

    const adjustedHue = calculateHueShift({
      baseHue: inputOKLCH.h || 0,
      baseLightness: originalLightness,
      targetLightness,
      adjustedLightnessScale,
      hueShiftMode: colorConfig.hueShiftMode,
    });

    const generatedColor = adjustToLightness({
      h: adjustedHue,
      c: inputOKLCH.c || 0,
      targetLightness,
    });

    palette[`--${colorConfig.prefix}-${key}`] = generatedColor;
  });

  // Override the closest level with the original input color for accuracy
  palette[`--${colorConfig.prefix}-${closestLevel}`] = colorConfig.color;

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
  colorConfig: NormalizedColorConfig;
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
  colorConfig: NormalizedColorConfig;
  inputColor: string;
  palette: Palette;
}): void => {
  // Only generate text colors if includeTextColors is enabled
  if (!colorConfig.includeTextColors) {
    return;
  }

  // Parse input color
  const inputColorObj = culori.parse(inputColor);
  if (!inputColorObj) {
    throw new Error("Invalid input color");
  }

  const inputRGB = culori.converter("rgb")(inputColorObj);
  if (!inputRGB) {
    throw new Error("Failed to convert color to RGB");
  }

  const normalizedColor = culori.formatHex(inputColorObj);
  const inputPerceptualLightness = getLightness(normalizedColor);

  // Find the primary color level (the level closest to input color)
  const inputColorOKLCH = culori.converter("oklch")(culori.parse(inputColor));
  const primaryLevel = findClosestLevel({
    inputLightness: inputPerceptualLightness,
    inputChroma: inputColorOKLCH?.c,
    inputHue: inputColorOKLCH?.h,
  });

  // Get primary color and its lightness
  const primaryColor = palette[`--${colorConfig.prefix}-${primaryLevel}`];
  if (!primaryColor) {
    return;
  }

  const primaryLightness = getLightness(primaryColor);

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
      const levelLightness = getLightness(levelColor);
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

// =============================================================================
// Palette Utility Functions
// =============================================================================

/**
 * Resolve CSS variable to its final HEX value by following all variable references
 */
export const resolveVariable = ({
  variableName,
  palette,
  fallback = "#000000",
}: {
  variableName: string;
  palette: Palette;
  fallback?: string;
}): string => {
  const visited = new Set<string>();

  const resolve = (varName: string): string => {
    // Ensure variable name starts with --
    const normalizedName = varName.startsWith("--") ? varName : `--${varName}`;

    // Check for circular reference
    if (visited.has(normalizedName)) {
      return fallback;
    }

    // Mark as visited
    visited.add(normalizedName);

    // Get value from palette
    const value = palette[normalizedName];

    // Early return if no value found
    if (!value) return fallback;

    // Return HEX color directly
    if (value.startsWith("#")) return value;

    // Resolve CSS variable reference recursively
    if (value.startsWith("var(")) {
      const innerVariable = value.slice(4, -1); // Remove var() wrapper
      return resolve(innerVariable);
    }

    return fallback;
  };

  return resolve(variableName);
};
