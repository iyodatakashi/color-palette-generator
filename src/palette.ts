// palette.ts

import type { CombinationConfig, Palette } from "./types";
import type { Oklch } from "culori";
import * as culori from "culori";
import {
  getLightness,
  findClosestLevel,
  calculateEvenScale,
} from "./lightness";
import { calculateHueShift } from "./hueShift";
import { setTransparentPalette } from "./transparentColor";
import { createContextLogger } from "./logger";
import { DEFAULT_COLOR_CONFIG, SCALE_LEVELS } from "./constants";
import type { ColorConfig } from "./types";

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

  // Route to appropriate handler based on purpose
  const colorConfig = input;

  // Check if this is combination color generation
  const isCombinationColor =
    colorConfig.id !== "primary" && colorConfig.id !== "base";

  if (isCombinationColor) {
    return generateSecondaryPalette({ colorConfig });
  } else {
    return generatePrimaryBasePalette(colorConfig);
  }
};

/**
 * Generate primary/base color palette (from HEX input)
 */
const generatePrimaryBasePalette = (colorConfig: ColorConfig): Palette => {
  // Generate base palette
  const palette = generatePaletteFromProcessedInput({ colorConfig });

  // Primary/Base specific override processing
  if (!colorConfig.enableChromaAdjustment) {
    const closestLevel = findClosestLevel({
      inputLightness: colorConfig.oklch.l,
      inputChroma: colorConfig.oklch.c,
      inputHue: colorConfig.oklch.h,
    });
    palette[`--${colorConfig.prefix}-${closestLevel}`] = "#ff0000"; // ガマットマッピング未調整→あとで直す！！！
  }

  return palette;
};

/**
 * Generate combination (secondary) color palette (from OKLCH input)
 */
const generateSecondaryPalette = ({
  colorConfig,
}: {
  colorConfig: ColorConfig;
}): Palette => {
  // Combination colors: no normalization, no override
  return generatePaletteFromProcessedInput({
    colorConfig,
  });
};

/**
 * Common palette generation logic after input processing
 */
const generatePaletteFromProcessedInput = ({
  colorConfig,
}: {
  colorConfig: ColorConfig;
}): Palette => {
  // Validate input OKLCH
  if (
    !colorConfig.oklch ||
    !isFinite(colorConfig.oklch.l) ||
    !isFinite(colorConfig.oklch.c) ||
    !isFinite(colorConfig.oklch.h || 0)
  ) {
    throw new Error("Invalid OKLCH input");
  }

  /*
  const inputRGB = culori.converter("rgb")(inputOKLCH);
  if (!inputRGB) {
    throw new Error("Failed to convert color to RGB");
  }
  */

  /*
  // Helper function to convert OKLCH to HEX with chroma-only gamut mapping
  const oklchToHex = (oklch: Oklch): string => {
    const clampedOklch = culori.clampChroma(oklch, "oklch", "rgb");
    return culori.formatHex(clampedOklch) || "#000000";
  };
  */

  /*
  const normalizedConfig = {
    ...combinationConfig,
    id,
    color: oklchToHex(inputOKLCH), // Convert OKLCH to HEX
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
    enableLightnessAdjustment: colorConfig.enableLightnessAdjustment ?? true,
    combinationHueShift: colorConfig.combinationHueShift,
  };
  */

  /*
  const inputLightness = getLightness(oklchToHex(inputOKLCH));
  */

  const closestLevel = findClosestLevel({
    inputLightness: colorConfig.oklch.l,
    inputChroma: colorConfig.oklch.c,
    inputHue: colorConfig.oklch.h,
  });

  const adjustedLightnessScale = calculateEvenScale({
    inputLightness: colorConfig.oklch.l * 100, // Convert 0-1 to 0-100
    inputChroma: colorConfig.oklch.c || 0,
    inputHue: colorConfig.oklch.h || 0,
    enableLightnessAdjustment: true,
  });

  const palette = generateOriginalPalette({
    colorConfig,
    inputOKLCH: colorConfig.oklch,
    closestLevel,
    adjustedLightnessScale,
    inputLightness: colorConfig.oklch.l,
  });

  setVariationColors({
    colorConfig,
    closestLevel,
    palette,
  });

  if (colorConfig.includeTransparent) {
    setTransparentPalette({
      palette,
      colorConfig,
    });
  }

  // Generate text colors last to ensure proper order
  setTextColor({
    colorConfig,
    inputOKLCH: colorConfig.oklch,
    palette,
  });

  return palette;
};

// =============================================================================
// Palette Generation Logic
// =============================================================================

/**
 * Calculate the original chroma a level should have (before unified curve)
 * This represents the natural maximum chroma for gamut mapping
 */
const calculateOriginalChromaForLevel = ({
  level,
  inputChroma,
  inputHue,
  targetLightness,
}: {
  level: number;
  inputChroma: number;
  inputHue: number;
  targetLightness: number;
}): number => {
  // Calculate the maximum chroma possible at this lightness and hue
  const maxChromaAtLightness = getMaxChromaAtLightness(
    targetLightness,
    inputHue
  );

  // Use a reasonable fraction of max chroma as the natural chroma for this level
  // This represents what the level should naturally have before any enhancement
  const naturalChromaRatio = Math.min(inputChroma / maxChromaAtLightness, 0.8); // Cap at 80% of max
  const naturalChroma = maxChromaAtLightness * naturalChromaRatio;

  // Debug: ensure valid result
  if (!isFinite(naturalChroma) || naturalChroma < 0) {
    return inputChroma;
  }

  return naturalChroma;
};

/**
 * Get maximum chroma at specific lightness for a hue
 */
const getMaxChromaAtLightness = (lightness: number, hue: number): number => {
  let maxChroma = 0;

  // Test different chroma values to find the maximum that stays in gamut
  for (let c = 0; c <= 0.4; c += 0.01) {
    const testColor: Oklch = {
      mode: "oklch" as const,
      l: lightness / 100,
      c: c,
      h: hue,
    };

    const rgbResult = culori.converter("rgb")(testColor);
    if (
      rgbResult &&
      rgbResult.r >= 0 &&
      rgbResult.r <= 1 &&
      rgbResult.g >= 0 &&
      rgbResult.g <= 1 &&
      rgbResult.b >= 0 &&
      rgbResult.b <= 1
    ) {
      maxChroma = c;
    } else {
      break;
    }
  }

  return maxChroma || 0.1; // Fallback value
};

/**
 * Calculate natural chroma distribution for all color types
 * Uses consistent Gaussian curve with peak at level 500, adjusts to pass through reference color
 */
const calculateNaturalChromaCurve = ({
  targetLevel,
  referenceLevel,
  referenceChroma,
  originalTargetChroma,
}: {
  targetLevel: number;
  referenceLevel: number;
  referenceChroma: number;
  originalTargetChroma?: number;
}): number => {
  // Unified curve parameters - same for all colors
  const peak = 500;
  const width = 200;
  const minChroma = 0.0;

  // Calculate multipliers for both target and reference levels
  const targetMultiplier = Math.exp(
    -Math.pow(targetLevel - peak, 2) / (2 * Math.pow(width, 2))
  );
  const referenceMultiplier = Math.exp(
    -Math.pow(referenceLevel - peak, 2) / (2 * Math.pow(width, 2))
  );

  // Adjust target multiplier
  const targetAdjusted = minChroma + (1.0 - minChroma) * targetMultiplier;
  const referenceAdjusted = minChroma + (1.0 - minChroma) * referenceMultiplier;

  // Calculate base chroma needed to pass through reference point
  const baseChroma = referenceChroma / referenceAdjusted;

  // Apply to target level
  let result = baseChroma * targetAdjusted;

  // Apply chroma upper limit: never exceed original target color's chroma
  if (originalTargetChroma !== undefined) {
    result = Math.min(result, originalTargetChroma);
  }

  return result;
};

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
  colorConfig: any; // Use any to avoid complex type issues
  inputLightness: number;
}): Palette => {
  const palette: Palette = {};
  const originalLightness = inputLightness; // Use original input lightness, not adjusted scale value

  // Helper function to convert OKLCH to HEX with chroma-only gamut mapping
  const oklchToHex = (oklch: Oklch): string => {
    const clampedOklch = culori.clampChroma(oklch, "oklch", "rgb");
    return culori.formatHex(clampedOklch) || "#000000";
  };

  Object.entries(adjustedLightnessScale).forEach(([key, targetLightness]) => {
    const level = parseInt(key);

    // Calculate base hue with hue shift mode
    const baseHue = inputOKLCH.h || 0;
    const adjustedHue = calculateHueShift({
      baseHue,
      baseLightness: originalLightness,
      targetLightness,
      adjustedLightnessScale,
      hueShiftMode: colorConfig.hueShiftMode,
    });

    // Apply combination hue shift if present (for secondary colors)
    const finalHue =
      colorConfig.combinationHueShift !== undefined
        ? colorConfig.combinationHueShift
        : adjustedHue;

    // Calculate chroma distribution using unified curve
    let targetChroma = inputOKLCH.c || 0;
    if (colorConfig.enableChromaAdjustment) {
      const originalChroma = inputOKLCH.c || 0;

      // Calculate original target chroma for this level (before unified curve)
      // This represents the maximum chroma this level should naturally have
      const originalTargetChroma = calculateOriginalChromaForLevel({
        level,
        inputChroma: originalChroma,
        inputHue: inputOKLCH.h || 0,
        targetLightness,
      });

      targetChroma = calculateNaturalChromaCurve({
        targetLevel: level,
        referenceLevel: closestLevel,
        referenceChroma: originalChroma,
        originalTargetChroma,
      });
    }

    // Create OKLCH color and convert to HEX with chroma-only gamut mapping
    const oklchColor: Oklch = {
      mode: "oklch" as const,
      l: targetLightness / 100, // Convert percentage to 0-1 range
      c: targetChroma,
      h: finalHue,
    };

    palette[`--${colorConfig.prefix}-${key}`] = oklchToHex(oklchColor);
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
  colorConfig: any;
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
  inputOKLCH,
  palette,
}: {
  colorConfig: any;
  inputOKLCH: Oklch;
  palette: Palette;
}): void => {
  // Only generate text colors if includeTextColors is enabled
  if (!colorConfig.includeTextColors) {
    return;
  }

  // Find the primary color level (the level closest to input color)
  const primaryLevel = findClosestLevel({
    inputLightness: inputOKLCH.l,
    inputChroma: inputOKLCH?.c,
    inputHue: inputOKLCH?.h,
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
