// constants.ts

import type { HueShiftMode, LightnessMethod, RandomColorConfig } from "./types";

/**
 * Level definitions
 */
export const SCALE_LEVELS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];
export const MIN_LEVEL = 50;
export const MAX_LEVEL = 950;

/**
 * Lightness scale definitions
 */
export const STANDARD_LIGHTNESS_SCALE: Record<number, number> = {
  50: 96,
  100: 92,
  200: 83,
  300: 74,
  400: 65,
  500: 56,
  600: 47,
  700: 38,
  800: 29,
  900: 20,
  950: 16,
};

export const MAX_LIGHTNESS = 96;
export const MIN_LIGHTNESS = 16;

/**
 * Alpha value definitions
 */
export const MIN_ALPHA = 0.1;
export const MAX_ALPHA = 1.0;

/**
 * Default settings
 */
export const DEFAULT_LIGHTNESS_METHOD = "hybrid" as const;

export const DEFAULT_HUE_SHIFT_MODE = "natural" as const;

export const DEFAULT_COLOR_CONFIG = {
  lightnessMethod: "hybrid" as LightnessMethod,
  hueShiftMode: "natural" as HueShiftMode,
  includeTransparent: true,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 500,
};

export const DEFAULT_BASE_COLOR_CONFIG = {
  lightnessMethod: "hybrid" as LightnessMethod,
  hueShiftMode: "fixed" as HueShiftMode,
  includeTransparent: true,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 950,
};

/**
 * Default options
 */
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
  saturationRange: [35, 75], // Moderate saturation
  lightnessRange: [
    STANDARD_LIGHTNESS_SCALE[300],
    STANDARD_LIGHTNESS_SCALE[700],
  ], // Specified lightness
  lightnessMethod: "hybrid", // Balanced lightness
  hueRange: [0, 360], // All hues
};
