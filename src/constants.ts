// constants.ts

import type { HueShiftMode, RandomColorConfig } from "./types";

/**
 * Level definitions
 */
export const SCALE_LEVELS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];
export const MIN_LEVEL = 0;
export const MAX_LEVEL = 1000;

/**
 * Lightness scale definitions
 */
export const STANDARD_LIGHTNESS_SCALE: Record<number, number> = {
  50: 97,
  100: 93,
  200: 85,
  300: 77,
  400: 69,
  500: 61,
  600: 53,
  700: 45,
  800: 37,
  900: 29,
  950: 25,
};

// Lightness scale limits
export const MAX_LIGHTNESS = 100;
export const MIN_LIGHTNESS = 20;

/**
 * Alpha value definitions
 */
export const MIN_ALPHA = 0.1;
export const MAX_ALPHA = 1.0;

/**
 * Default settings
 */

export const DEFAULT_HUE_SHIFT_MODE = "natural" as const;

export const DEFAULT_COLOR_CONFIG = {
  hueShiftMode: "natural" as HueShiftMode,
  includeTransparent: false,
  includeTextColors: false,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 500,
  enableChromaAdjustment: false,
};

export const DEFAULT_BASE_COLOR_CONFIG = {
  hueShiftMode: "fixed" as HueShiftMode,
  includeTransparent: false,
  includeTextColors: false,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 950,
  enableChromaAdjustment: false,
};

/**
 * Default options
 */
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
  chromaRange: [35, 75], // Moderate chroma
  lightnessRange: [
    STANDARD_LIGHTNESS_SCALE[300],
    STANDARD_LIGHTNESS_SCALE[700],
  ], // Specified lightness
  hueRange: [0, 360], // All hues
};
