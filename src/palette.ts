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
import {
  SCALE_LEVELS,
  DEFAULT_LEVEL_500_LIGHTNESS,
  MIN_LIGHTNESS,
  MAX_LIGHTNESS,
} from "./constants";
import type { ColorConfig } from "./types";
import { oklchToHexAdjustChroma } from "./colorUtils";

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
      inputLightness: colorConfig.oklch.l, // 0-1 range
      inputChroma: colorConfig.oklch.c,
      inputHue: colorConfig.oklch.h,
    });
    palette[`--${colorConfig.prefix}-${closestLevel}`] = oklchToHexAdjustChroma(
      colorConfig.oklch
    );
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
  // Validate input OKLCH
  if (
    !colorConfig.oklch ||
    !isFinite(colorConfig.oklch.l) ||
    !isFinite(colorConfig.oklch.c) ||
    !isFinite(colorConfig.oklch.h || 0)
  ) {
    throw new Error("Invalid OKLCH input");
  }

  const closestLevel = findClosestLevel({
    inputLightness: colorConfig.oklch.l, // 0-1 range
    inputChroma: colorConfig.oklch.c,
    inputHue: colorConfig.oklch.h,
  });

  // Secondary colors: use default sigmoid without chroma adjustment
  const adjustedLightnessScale = calculateEvenScale({
    inputLightness: colorConfig.oklch.l, // 0-1 range
    inputChroma: colorConfig.oklch.c || 0,
    inputHue: colorConfig.oklch.h || 0,
    enableLightnessAdjustment: false, // Use default sigmoid for secondary colors
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

  const closestLevel = findClosestLevel({
    inputLightness: colorConfig.oklch.l, // 0-1 range
    inputChroma: colorConfig.oklch.c,
    inputHue: colorConfig.oklch.h,
  });

  const adjustedLightnessScale = calculateEvenScale({
    inputLightness: colorConfig.oklch.l, // 0-1 range
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
  // Create OKLCH color at target lightness with input chroma
  const testColor: Oklch = {
    mode: "oklch" as const,
    l: targetLightness, // 0-1 range
    c: inputChroma,
    h: inputHue,
  };

  // Apply gamut mapping to get the maximum achievable chroma at this lightness
  const clampedColor = culori.clampChroma(testColor, "oklch", "rgb");
  const result = clampedColor.c || inputChroma;

  // Debug: ensure valid result
  if (!isFinite(result) || result < 0) {
    console.warn(
      `Invalid chroma calculated for level ${level}:`,
      result,
      "using input chroma:",
      inputChroma
    );
    return inputChroma;
  }

  return result;
};

/**
 * Calculate natural chroma distribution for all color types
 * Uses consistent Gaussian curve with peak at level 500, adjusts to pass through reference color
 */
/**
 * Super-Gaussian function for flatter center region
 */
const superGaussianGain = (
  lightness: number,
  { center = 0.5, sigma = 0.22, order = 6 } = {}
): number => {
  const x = Math.min(1, Math.max(0, lightness));
  const z = Math.abs(x - center) / Math.max(1e-6, sigma);
  return Math.exp(-Math.pow(z, order)); // Higher order = flatter center
};

const calculateNaturalChromaCurve = ({
  targetLevel,
  referenceLevel,
  referenceChroma,
  maxChromaForLevel,
}: {
  targetLevel: number;
  referenceLevel: number;
  referenceChroma: number;
  maxChromaForLevel?: number;
}): number => {
  // Convert levels to 0-1 range for super-Gaussian
  const minLevel = 50;
  const maxLevel = 950;
  const range = maxLevel - minLevel;

  const targetLightness = (targetLevel - minLevel) / range;
  const referenceLightness = (referenceLevel - minLevel) / range;

  // Super-Gaussian parameters: flatter center, moderate suppression at level 200
  // Center is always at level 500 (middle of scale), regardless of reference level

  // 彩度抑制カーブパラメーター
  // sigma大→フラット領域の幅大
  // order大→落ち込みの急激さ大
  const center =
    (DEFAULT_LEVEL_500_LIGHTNESS - MIN_LIGHTNESS) /
    (MAX_LIGHTNESS - MIN_LIGHTNESS); // レベル500の実際の明度位置
  const sigma = 0.35; // Moderate flat region - suppression starts at moderate distance from center
  const order = 1.5; // Moderate order = balanced suppression at level 200

  // Calculate super-Gaussian multipliers
  const targetMultiplier = superGaussianGain(targetLightness, {
    center,
    sigma,
    order,
  });
  const referenceMultiplier = superGaussianGain(referenceLightness, {
    center,
    sigma,
    order,
  });

  // Calculate base chroma needed to pass through reference point
  const baseChroma = referenceChroma / referenceMultiplier;

  // Apply to target level
  let result = baseChroma * targetMultiplier;

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
    return oklchToHexAdjustChroma(oklch);
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

      // Calculate chroma using Gaussian curve, limited by original chroma
      const gaussianResult = calculateNaturalChromaCurve({
        targetLevel: level,
        referenceLevel: closestLevel,
        referenceChroma: originalChroma,
        maxChromaForLevel: undefined, // No artificial limits in Gaussian curve
      });

      // Apply limits: For base colors, disable chroma suppression temporarily
      // For other colors, limit by original chroma
      targetChroma = Math.min(gaussianResult, originalChroma);
    }

    // Create OKLCH color and convert to HEX with chroma-only gamut mapping
    const oklchColor: Oklch = {
      mode: "oklch" as const,
      l: targetLightness, // 0-1 range // Convert percentage to 0-1 range
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
    inputLightness: inputOKLCH.l, // 0-1 range
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
    targetLightness: 0.6, // 0-1 range
    isLighter: false, // Find darker color
  });

  // Find text color for dark background (light text on dark background)
  const textColorForDarkBackground = findTextColorLevel({
    primaryLevel,
    primaryLightness,
    palette,
    prefix: colorConfig.prefix,
    targetLightness: 0.5, // 0-1 range
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
