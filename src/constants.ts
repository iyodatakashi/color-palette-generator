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

// Lightness scale limits (0-1 range)
export const MAX_LIGHTNESS = 0.97;
export const MIN_LIGHTNESS = 0.25;

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
  enableChromaAdjustment: true,
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
  chromaRange: [0.35, 0.75], // Moderate chroma (0-1 range)
  lightnessRange: [0.82, 0.42], // レベル300-700相当の明度範囲 (0-1 range)
  hueRange: [0, 360], // All hues
};
