// palette.ts

import type { Palette } from "./types";
import type { Oklch } from "culori";
import {
  getLightness,
  findClosestLevel,
  generateLightnessScale,
} from "./lightness";
import { calculateHueShift } from "./hueShift";
import { setTransparentPalette } from "./transparentColor";
import { SCALE_LEVELS, NATURAL_CHROMA_CURVE_PARAMS } from "./constants";
import type { ColorConfig } from "./types";
import { oklchToHexPerceptual, isValidOklch } from "./colorUtils";

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
  return generateEachPalette({ colorConfig });
};

/**
 * Generate color palette (from OKLCH input)
 */
const generateEachPalette = ({
  colorConfig,
}: {
  colorConfig: ColorConfig;
}): Palette => {
  // Validate input OKLCH
  if (!isValidOklch(colorConfig.oklch)) {
    throw new Error("Invalid OKLCH input");
  }

  const closestLevel = findClosestLevel({
    inputLightness: colorConfig.oklch.l,
    inputChroma: colorConfig.oklch.c,
    inputHue: colorConfig.oklch.h,
  });

  const adjustedLightnessScale = generateLightnessScale({
    inputLightness: colorConfig.oklch.l,
    inputChroma: colorConfig.oklch.c ?? 0,
    inputHue: colorConfig.oklch.h ?? 0,
    enableLightnessAdjustment: true,
  });

  const palette = generateSolidPalette({
    colorConfig,
    closestLevel,
    adjustedLightnessScale,
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
    palette,
  });

  return palette;
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
  { center, sigma, order }: { center: number; sigma: number; order: number }
) => {
  const x = Math.min(1, Math.max(0, lightness));
  const z = Math.abs(x - center) / Math.max(1e-6, sigma);
  return Math.exp(-Math.pow(z, order)); // Higher order = flatter center
};

const calculateNaturalChromaCurve = ({
  targetLevel,
  referenceLevel,
  referenceChroma,
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

  // ガウシアンカーブを基準色を通るカーブに調整（中心は固定）
  const targetMultiplier = superGaussianGain(
    targetLightness,
    NATURAL_CHROMA_CURVE_PARAMS
  );

  // 基準色の実際のレベルでのガウシアン乗数を計算
  const actualReferencePosition = (referenceLevel - minLevel) / range;
  const actualReferenceMultiplier = superGaussianGain(
    actualReferencePosition,
    NATURAL_CHROMA_CURVE_PARAMS
  );

  // 基準色の彩度が実際のレベルで現れるようにスケール調整
  const scaledMultiplier = targetMultiplier / actualReferenceMultiplier;

  // 基準色を通るガウシアンカーブを適用
  let result = referenceChroma * scaledMultiplier;

  // 基準色の彩度に基づいて彩度カーブの上限を抑制
  // 基準色の彩度が高い場合、ガウシアンカーブのピークを抑制
  const maxAllowedChroma = referenceChroma * 1.5; // 基準色の1.5倍を上限とする
  if (result > maxAllowedChroma) {
    result = maxAllowedChroma;
  }

  return result;
};

/**
 * Generate solid color palette
 */
const generateSolidPalette = ({
  colorConfig,
  closestLevel,
  adjustedLightnessScale,
}: {
  colorConfig: ColorConfig;
  closestLevel: number;
  adjustedLightnessScale: Record<number, number>;
}): Palette => {
  const palette: Palette = {};
  const inputOKLCH = colorConfig.oklch;

  // Helper function to convert OKLCH to HEX with perceptual gamut mapping
  const oklchToHex = (oklch: Oklch): string => {
    return oklchToHexPerceptual(oklch);
  };

  Object.entries(adjustedLightnessScale).forEach(([key, targetLightness]) => {
    const level = parseInt(key);

    // Use base hue and chroma from reference color
    const baseHue = inputOKLCH.h || 0;
    const baseChroma = inputOKLCH.c || 0;

    // Apply hue shift mode
    const adjustedHue = calculateHueShift({
      colorConfig,
      targetLightness,
      adjustedLightnessScale,
    });

    // Apply combination hue shift if present (for secondary colors)
    const finalHue =
      colorConfig.combinationHueShift !== undefined
        ? colorConfig.combinationHueShift
        : adjustedHue;

    // Apply NaturalChromaCurve for chroma suppression
    let targetChroma = baseChroma;
    if (colorConfig.enableChromaAdjustment) {
      // Use the adjusted lightness scale to find the reference level
      // This ensures we use the hue-specific maximum chroma lightness corrected scale
      const referenceLevel = findClosestLevel({
        inputLightness: inputOKLCH.l,
        inputChroma: inputOKLCH.c,
        inputHue: inputOKLCH.h,
      });

      targetChroma = calculateNaturalChromaCurve({
        targetLevel: level,
        referenceLevel: referenceLevel, // Use adjusted scale to find reference level
        referenceChroma: baseChroma,
      });
    }

    // Use scale lightness for all levels (default sigmoid curve)
    const finalLightness = targetLightness;

    // Create OKLCH color and convert to HEX with perceptual gamut mapping
    const oklchColor: Oklch = {
      mode: "oklch" as const,
      l: finalLightness, // 0-1 range
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
  colorConfig: ColorConfig;
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
  palette,
}: {
  colorConfig: ColorConfig;
  palette: Palette;
}): void => {
  // Only generate text colors if includeTextColors is enabled
  if (!colorConfig.includeTextColors) {
    return;
  }

  const inputOKLCH = colorConfig.oklch;

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
