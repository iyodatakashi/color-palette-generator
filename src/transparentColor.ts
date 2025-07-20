// transparentColor.ts

import type { Palette, ColorConfig } from "./types";
import { hexToRGB } from "./colorUtils";
import { createContextLogger } from "./logger";
import {
  SCALE_LEVELS,
  MAX_LEVEL,
  MIN_LEVEL,
  MAX_ALPHA,
  MIN_ALPHA,
} from "./constants";

const log = createContextLogger("TransparentColor");

// =============================================================================
// Transparent Color Palette Generation
// =============================================================================

/**
 * Generate transparent color palette
 */
export const setTransparentPalette = ({
  colorConfig,
  palette,
}: {
  colorConfig: ColorConfig;
  palette: Palette;
}): void => {
  if (!colorConfig.transparentOriginLevel) return;

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

    palette[`--${colorConfig.prefix}-${level}-transparent`] = transparentColor;
  });
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
  const STEP_SIZE = 50;

  if (level < transparentOriginLevel) {
    // Bright direction (from 50 to transparentOriginLevel)
    const totalSteps = (transparentOriginLevel - MIN_LEVEL) / STEP_SIZE;

    if (totalSteps === 0) {
      return MIN_ALPHA;
    }

    const currentStep = (level - MIN_LEVEL) / STEP_SIZE;
    const stepAlpha = alphaDifference / totalSteps;

    return MIN_ALPHA + stepAlpha * currentStep;
  } else {
    // Dark direction (from transparentOriginLevel to 950)
    const totalSteps = (MAX_LEVEL - transparentOriginLevel) / STEP_SIZE;

    if (totalSteps === 0) {
      return MIN_ALPHA;
    }

    const currentStep = (level - transparentOriginLevel) / STEP_SIZE;
    const stepAlpha = alphaDifference / totalSteps;

    return MAX_ALPHA - stepAlpha * currentStep;
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

  try {
    target = hexToRGB(targetSolidColor);

    if (isNaN(target.r) || isNaN(target.g) || isNaN(target.b)) {
      log.error(`Invalid RGB from target color`, { targetSolidColor, target });
      return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
    }
  } catch (error) {
    log.error(`Error converting target color`, { targetSolidColor, error });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  try {
    bg = hexToRGB(backgroundColor);

    if (isNaN(bg.r) || isNaN(bg.g) || isNaN(bg.b)) {
      log.error(`Invalid RGB from background color`, { backgroundColor, bg });
      return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
    }
  } catch (error) {
    log.error(`Error converting background color`, { backgroundColor, error });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

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
