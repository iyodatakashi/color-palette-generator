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

  setTextColor({
    colorConfig: normalizedConfig,
    inputColor: normalizedColor,
    palette,
  });

  if (colorConfig.includeTransparent) {
    setTransparentPalette({
      palette,
      colorConfig: normalizedConfig,
    });
  }

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
 * Find the color with the smallest number that has lightness 70 or below from the entire palette,
 * compare its perceptual lightness with the input color, and use the darker one as the text color.
 * However, the result must always be a CSS variable reference.
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
  const inputRGB = hexToRGB(inputColor);
  const normalizedColor = rgbToHex(inputRGB);
  const inputPerceptualLightness = getLightness({
    color: normalizedColor,
    lightnessMethod: "perceptual",
  });

  // Get the color with the smallest number that has lightness 70 or below from the entire palette
  let selectedLevel: number | null = null;
  let smallestLevel = Infinity;

  SCALE_LEVELS.forEach((level) => {
    const colorKey = `--${colorConfig.prefix}-${level}`;
    const levelColor = palette[colorKey];

    if (levelColor) {
      const perceptualLightness = getLightness({
        color: levelColor,
        lightnessMethod: "perceptual",
      });

      // Find the level with lightness 70 or below and the smallest number
      if (perceptualLightness <= 70 && level < smallestLevel) {
        selectedLevel = level;
        smallestLevel = level;
      }
    }
  });

  // Compare perceptual lightness of input color and found dark palette color
  if (selectedLevel !== null) {
    const selectedColor = palette[`--${colorConfig.prefix}-${selectedLevel}`];
    const selectedPerceptualLightness = getLightness({
      color: selectedColor,
      lightnessMethod: "perceptual",
    });

    // Select the darker one (lower perceptual lightness) as text color
    if (inputPerceptualLightness < selectedPerceptualLightness) {
      // If input color is darker, use the level of the same color as input color
      // Input color is already placed at closestLevel as normalizedConfig.color
      const inputClosestLevel = findClosestLevel({
        inputLightness: inputPerceptualLightness,
        lightnessMethod: colorConfig.lightnessMethod,
      });
      palette[
        `--${colorConfig.prefix}-text-color`
      ] = `var(--${colorConfig.prefix}-${inputClosestLevel})`;
    } else {
      // If palette color is darker
      palette[
        `--${colorConfig.prefix}-text-color`
      ] = `var(--${colorConfig.prefix}-${selectedLevel})`;
    }
  } else {
    // If no palette color with lightness 70 or below is found, use input color level
    const inputClosestLevel = findClosestLevel({
      inputLightness: inputPerceptualLightness,
      lightnessMethod: colorConfig.lightnessMethod,
    });
    palette[
      `--${colorConfig.prefix}-text-color`
    ] = `var(--${colorConfig.prefix}-${inputClosestLevel})`;
  }
};
