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

  // Find text color for light background (dark text on light background)
  let textColorForLightBackground: number | null = null;

  // First check if the primary color itself is dark enough
  const primaryColor = palette[`--${colorConfig.prefix}-${primaryLevel}`];
  if (primaryColor) {
    const primaryLightness = getLightness({
      color: primaryColor,
      lightnessMethod: "perceptual",
    });

    if (primaryLightness <= 70) {
      // Primary color is dark enough, use it
      textColorForLightBackground = primaryLevel;
    } else {
      // Primary color is too light, find a darker level
      const primaryIndex = SCALE_LEVELS.indexOf(primaryLevel);
      for (let i = primaryIndex + 1; i < SCALE_LEVELS.length; i++) {
        const level = SCALE_LEVELS[i];
        const levelColor = palette[`--${colorConfig.prefix}-${level}`];
        if (levelColor) {
          const levelLightness = getLightness({
            color: levelColor,
            lightnessMethod: "perceptual",
          });
          if (levelLightness <= 70) {
            textColorForLightBackground = level;
            break;
          }
        }
      }

      // If no suitable dark color found, use the darkest available color
      if (textColorForLightBackground === null) {
        textColorForLightBackground = 950;
      }
    }
  }

  // Find text color for dark background (light text on dark background)
  let textColorForDarkBackground: number | null = null;

  // First check if the primary color itself is light enough
  if (primaryColor) {
    const primaryLightness = getLightness({
      color: primaryColor,
      lightnessMethod: "perceptual",
    });

    if (primaryLightness >= 30) {
      // Primary color is light enough, use it
      textColorForDarkBackground = primaryLevel;
    } else {
      // Primary color is too dark, find a lighter level
      const primaryIndex = SCALE_LEVELS.indexOf(primaryLevel);
      for (let i = primaryIndex - 1; i >= 0; i--) {
        const level = SCALE_LEVELS[i];
        const levelColor = palette[`--${colorConfig.prefix}-${level}`];
        if (levelColor) {
          const levelLightness = getLightness({
            color: levelColor,
            lightnessMethod: "perceptual",
          });
          if (levelLightness >= 30) {
            textColorForDarkBackground = level;
            break;
          }
        }
      }

      // If no suitable light color found, use the lightest available color
      if (textColorForDarkBackground === null) {
        textColorForDarkBackground = 50;
      }
    }
  }

  // Set light theme text color (dark text on light background)
  if (textColorForLightBackground !== null) {
    palette[
      `--${colorConfig.prefix}-text-color-on-light`
    ] = `var(--${colorConfig.prefix}-${textColorForLightBackground})`;
  } else {
    // Fallback to primary color if no suitable dark color found
    palette[
      `--${colorConfig.prefix}-text-color-on-light`
    ] = `var(--${colorConfig.prefix}-${primaryLevel})`;
  }

  // Set dark theme text color (light text on dark background)
  if (textColorForDarkBackground !== null) {
    palette[
      `--${colorConfig.prefix}-text-color-on-dark`
    ] = `var(--${colorConfig.prefix}-${textColorForDarkBackground})`;
  } else {
    // Fallback to primary color if no suitable light color found
    palette[
      `--${colorConfig.prefix}-text-color-on-dark`
    ] = `var(--${colorConfig.prefix}-${primaryLevel})`;
  }
};
