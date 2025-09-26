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

// Lightness scale limits (0-1 range)
export const MAX_LIGHTNESS = 0.96;
export const MIN_LIGHTNESS = 0.25;

// Default level 500 lightness (middle of the scale)
export const DEFAULT_LEVEL_500_LIGHTNESS = 0.64;

/**
 * Natural Chroma Curve
 */
// 彩度抑制カーブパラメーター
// sigma大→フラット領域の幅大
// order大→落ち込みの急激さ大
export const NATURAL_CHROMA_CURVE_PARAMS = {
  center:
    (DEFAULT_LEVEL_500_LIGHTNESS - MIN_LIGHTNESS) /
    (MAX_LIGHTNESS - MIN_LIGHTNESS),
  sigma: 0.4,
  order: 1.5,
};

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

export const TEXT_LIGHTNESS_ON_LIGHT = 0.6;
export const TEXT_LIGHTNESS_ON_DARK = 0.4;

/**
 * Default options
 */
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
  chromaRange: [0.15, 0.25], // Moderate chroma (0-0.4)
  lightnessRange: [0.82, 0.47], // レベル300-700相当の明度範囲 (0-1 range)
  hueRange: [0, 360], // All hues
};
