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
 * Lightness scale definitions - DEPRECATED: Now using sigmoid function
 */
// STANDARD_LIGHTNESS_SCALE removed - using dynamic sigmoid calculation

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
  enableChromaAdjustment: true, // Enable natural chroma distribution for base colors
};

/**
 * Default options
 */
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
  chromaRange: [35, 75], // Moderate chroma
  lightnessRange: [75, 35], // レベル300-700相当の明度範囲
  hueRange: [0, 360], // All hues
};
