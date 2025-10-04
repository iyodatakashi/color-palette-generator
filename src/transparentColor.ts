// transparentColor.ts

import type { Palette, ColorConfig } from "./types";
import * as culori from "culori";
import { createContextLogger } from "./logger";
import { SCALE_LEVELS, MAX_ALPHA, MIN_ALPHA } from "./constants";

const log = createContextLogger("TransparentColor");

// =============================================================================
// Transparent Color Palette Generation
// =============================================================================

/**
 * Generate transparent color palette
 */
export const getTransparentPalette = ({
  colorConfig,
  palette,
}: {
  colorConfig: ColorConfig;
  palette: Palette;
}): Palette => {
  const colors: Palette = {};

  if (!colorConfig.transparentOriginLevel) return colors;

  SCALE_LEVELS.forEach((level) => {
    const transparentOriginLevel = colorConfig.transparentOriginLevel as number;
    const targetSolidColor = palette[`--${colorConfig.prefix}-${level}`];

    if (!targetSolidColor) return;

    // Normalize and validate input values
    const normalizedColor = targetSolidColor.trim();
    if (
      !normalizedColor ||
      normalizedColor === "" ||
      normalizedColor === "undefined"
    ) {
      log.warn(`Invalid target solid color for level ${level}`, {
        targetSolidColor,
      });
      return;
    }

    // Calculate transparency
    const fixedAlpha = getAlphaForLevel({
      level,
      transparentOriginLevel: transparentOriginLevel,
    });

    // Determine background color (bright background for levels below origin, dark background for levels above)
    const backgroundColor =
      level <= transparentOriginLevel
        ? colorConfig.bgColorLight
        : colorConfig.bgColorDark;

    if (!backgroundColor) return;

    // Calculate transparent color
    const transparentColor = calculateTransparentColor({
      targetSolidColor: normalizedColor,
      backgroundColor,
      fixedAlpha,
    });

    colors[`--${colorConfig.prefix}-${level}-transparent`] = transparentColor;
  });

  return colors;
};

// =============================================================================
// Transparency Calculation
// =============================================================================

/**
 * Calculate transparency based on level
 */
const getAlphaForLevel = ({
  level,
  transparentOriginLevel,
}: {
  level: number;
  transparentOriginLevel: number;
}): number => {
  // originLevel itself is always MAX_ALPHA
  if (level === transparentOriginLevel) {
    return MAX_ALPHA;
  }

  const alphaDifference = MAX_ALPHA - MIN_ALPHA; // 0.9

  if (level < transparentOriginLevel) {
    // Bright direction (from 50 to transparentOriginLevel)
    // Calculate the ratio of how far we are from the origin
    const levelDifference = transparentOriginLevel - level;
    const maxLevelDifference = transparentOriginLevel - 50; // From 50 to origin

    if (maxLevelDifference === 0) {
      return MAX_ALPHA;
    }

    const ratio = levelDifference / maxLevelDifference;
    return MAX_ALPHA - alphaDifference * ratio;
  } else {
    // Dark direction (from transparentOriginLevel to 950)
    // Calculate the ratio of how far we are from the origin
    const levelDifference = level - transparentOriginLevel;
    const maxLevelDifference = 950 - transparentOriginLevel; // From origin to 950

    if (maxLevelDifference === 0) {
      return MAX_ALPHA;
    }

    const ratio = levelDifference / maxLevelDifference;
    return MAX_ALPHA - alphaDifference * ratio;
  }
};

// =============================================================================
// Transparent Color Calculation
// =============================================================================

/**
 * Reverse calculate transparent color from fixed transparency
 */
const calculateTransparentColor = ({
  targetSolidColor,
  backgroundColor,
  fixedAlpha,
}: {
  targetSolidColor: string;
  backgroundColor: string;
  fixedAlpha: number;
}): string => {
  // RGB conversion and error handling
  let target: { r: number; g: number; b: number };
  let bg: { r: number; g: number; b: number };

  // Parse and convert target color - culori handles validation
  const targetColorObj = culori.parse(targetSolidColor);
  if (!targetColorObj) {
    log.error(`Invalid target color`, { targetSolidColor });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  const targetRGB = culori.converter("rgb")(targetColorObj);
  if (!targetRGB) {
    log.error(`Failed to convert target color to RGB`, { targetSolidColor });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  // Convert culori RGB (0-1) to 0-255 range
  target = {
    r: targetRGB.r * 255,
    g: targetRGB.g * 255,
    b: targetRGB.b * 255,
  };

  // Parse and convert background color - culori handles validation
  const bgColorObj = culori.parse(backgroundColor);
  if (!bgColorObj) {
    log.error(`Invalid background color`, { backgroundColor });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  const bgRGB = culori.converter("rgb")(bgColorObj);
  if (!bgRGB) {
    log.error(`Failed to convert background color to RGB`, { backgroundColor });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  // Convert culori RGB (0-1) to 0-255 range
  bg = {
    r: bgRGB.r * 255,
    g: bgRGB.g * 255,
    b: bgRGB.b * 255,
  };

  // Prevent division by zero
  if (fixedAlpha === 0) {
    log.warn("Alpha is 0, returning background color");
    return `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.000)`;
  }

  // Reverse calculate RGB values of transparent color
  const backgroundMultiplier = 1 - fixedAlpha;
  const transparentR = (target.r - bg.r * backgroundMultiplier) / fixedAlpha;
  const transparentG = (target.g - bg.g * backgroundMultiplier) / fixedAlpha;
  const transparentB = (target.b - bg.b * backgroundMultiplier) / fixedAlpha;

  // Clamp to 0-255 range
  const clampedR = clampRGBValue(transparentR);
  const clampedG = clampRGBValue(transparentG);
  const clampedB = clampRGBValue(transparentB);

  return `rgba(${clampedR}, ${clampedG}, ${clampedB}, ${fixedAlpha.toFixed(
    3
  )})`;
};

/**
 * Clamp RGB value to 0-255 range
 */
const clampRGBValue = (value: number): number => {
  return Math.max(0, Math.min(255, Math.round(value)));
};
