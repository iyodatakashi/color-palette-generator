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
    includeTextColors: colorConfig.includeTextColors || false,
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

  // Generate text colors separately to ensure proper order
  const textColorPalette: Palette = {};
  setTextColor({
    colorConfig: normalizedConfig,
    inputColor: normalizedColor,
    palette: textColorPalette,
  });

  if (colorConfig.includeTransparent) {
    setTransparentPalette({
      palette,
      colorConfig: normalizedConfig,
    });
  }

  // Merge text colors at the end to ensure they appear after all other variables
  Object.assign(palette, textColorPalette);

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

  // Find dark text color for light background (lightness <= 70)
  let darkTextLevel: number | null = null;
  let smallestDarkLevel = Infinity;

  SCALE_LEVELS.forEach((level) => {
    const colorKey = `--${colorConfig.prefix}-${level}`;
    const levelColor = palette[colorKey];

    if (levelColor) {
      const perceptualLightness = getLightness({
        color: levelColor,
        lightnessMethod: "perceptual",
      });

      if (perceptualLightness <= 70 && level < smallestDarkLevel) {
        darkTextLevel = level;
        smallestDarkLevel = level;
      }
    }
  });

  // Find light text color for dark background (lightness >= 30)
  let lightTextLevel: number | null = null;
  let largestLightLevel = -Infinity;

  SCALE_LEVELS.forEach((level) => {
    const colorKey = `--${colorConfig.prefix}-${level}`;
    const levelColor = palette[colorKey];

    if (levelColor) {
      const perceptualLightness = getLightness({
        color: levelColor,
        lightnessMethod: "perceptual",
      });

      if (perceptualLightness >= 30 && level > largestLightLevel) {
        lightTextLevel = level;
        largestLightLevel = level;
      }
    }
  });

  // Set light theme text color (dark text on light background)
  if (darkTextLevel !== null) {
    const selectedColor = palette[`--${colorConfig.prefix}-${darkTextLevel}`];
    const selectedPerceptualLightness = getLightness({
      color: selectedColor,
      lightnessMethod: "perceptual",
    });

    if (inputPerceptualLightness < selectedPerceptualLightness) {
      const inputClosestLevel = findClosestLevel({
        inputLightness: inputPerceptualLightness,
        lightnessMethod: colorConfig.lightnessMethod,
      });
      palette[
        `--${colorConfig.prefix}-text-color-on-light`
      ] = `var(--${colorConfig.prefix}-${inputClosestLevel})`;
    } else {
      palette[
        `--${colorConfig.prefix}-text-color-on-light`
      ] = `var(--${colorConfig.prefix}-${darkTextLevel})`;
    }
  } else {
    const inputClosestLevel = findClosestLevel({
      inputLightness: inputPerceptualLightness,
      lightnessMethod: colorConfig.lightnessMethod,
    });
    palette[
      `--${colorConfig.prefix}-text-color-on-light`
    ] = `var(--${colorConfig.prefix}-${inputClosestLevel})`;
  }

  // Set dark theme text color (light text on dark background)
  if (lightTextLevel !== null) {
    const selectedColor = palette[`--${colorConfig.prefix}-${lightTextLevel}`];
    const selectedPerceptualLightness = getLightness({
      color: selectedColor,
      lightnessMethod: "perceptual",
    });

    if (inputPerceptualLightness > selectedPerceptualLightness) {
      const inputClosestLevel = findClosestLevel({
        inputLightness: inputPerceptualLightness,
        lightnessMethod: colorConfig.lightnessMethod,
      });
      palette[
        `--${colorConfig.prefix}-text-color-on-dark`
      ] = `var(--${colorConfig.prefix}-${inputClosestLevel})`;
    } else {
      palette[
        `--${colorConfig.prefix}-text-color-on-dark`
      ] = `var(--${colorConfig.prefix}-${lightTextLevel})`;
    }
  } else {
    const inputClosestLevel = findClosestLevel({
      inputLightness: inputPerceptualLightness,
      lightnessMethod: colorConfig.lightnessMethod,
    });
    palette[
      `--${colorConfig.prefix}-text-color-on-dark`
    ] = `var(--${colorConfig.prefix}-${inputClosestLevel})`;
  }

  // Set default text color to light theme version for backward compatibility
  // This must be set AFTER both on-light and on-dark are defined
  palette[
    `--${colorConfig.prefix}-text-color`
  ] = `var(--${colorConfig.prefix}-text-color-on-light)`;
};
