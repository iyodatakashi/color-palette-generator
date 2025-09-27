// constants.ts

import type { HueShiftMode, RandomColorConfig } from "./types";

// =============================================================================
// CORE SCALE DEFINITIONS
// =============================================================================

/**
 * Color scale level definitions
 */
export const SCALE_LEVELS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];
export const MIN_LEVEL = 0;
export const MAX_LEVEL = 1000;

/**
 * Lightness scale boundaries
 */
export const MAX_LIGHTNESS = 1.0;
export const MIN_LIGHTNESS = 0.2;

/**
 * Default lightness for level 500 (middle of the scale)
 */
export const DEFAULT_LEVEL_500_LIGHTNESS = 0.64;

// =============================================================================
// SIGMOID FUNCTION PARAMETERS
// =============================================================================

/**
 * Sigmoid function parameters for lightness distribution
 */
export const DEFAULT_K_SIGNED = 0.18; // Sigmoid steepness
export const DEFAULT_V_BASE = 2.0; // Asymmetric base
export const DEFAULT_K_MIN = 1e-6; // Minimum slope guard
export const SIGMOID_X_RANGE = 10; // Normalization range for x values
export const SIGMOID_EPSILON = 1e-12; // Small value for division safety

// =============================================================================
// CHROMA PARAMETERS
// =============================================================================

/**
 * Natural chroma curve parameters
 * 彩度抑制カーブパラメーター
 * sigma大→フラット領域の幅大
 * order大→落ち込みの急激さ大
 */
export const NATURAL_CHROMA_CURVE_PARAMS = {
  center:
    (DEFAULT_LEVEL_500_LIGHTNESS - MIN_LIGHTNESS) /
    (MAX_LIGHTNESS - MIN_LIGHTNESS),
  sigma: 0.4,
  order: 1.5,
};

export const MAX_CHROMA_RATIO_FROM_ORIGIN_COLOR = 1.4;

/**
 * Base color generation parameters
 */
export const BASE_COLOR_CHROMA_MIN = 0.02;
export const BASE_COLOR_CHROMA_MAX = 0.06;
export const BASE_COLOR_CHROMA_MULTIPLIER = 0.08;
export const BASE_COLOR_NEUTRAL_CHROMA = 0.01;

export const FALLBACK_MAX_CHROMA = 0.2;

// =============================================================================
// HUE SHIFT PARAMETERS
// =============================================================================

/**
 * Hue shift parameters
 */
export const MAX_HUE_SHIFT = 50;

/**
 * Temperature direction calculation offset angle (in degrees)
 */
export const TEMPERATURE_DIRECTION_OFFSET_DEGREES = 45;

// =============================================================================
// TRANSPARENCY AND ALPHA PARAMETERS
// =============================================================================

/**
 * Alpha value boundaries
 */
export const MIN_ALPHA = 0.1;
export const MAX_ALPHA = 1.0;

// =============================================================================
// TEXT COLOR PARAMETERS
// =============================================================================

/**
 * Text color lightness thresholds
 */
export const TEXT_LIGHTNESS_ON_LIGHT = 0.6;
export const TEXT_LIGHTNESS_ON_DARK = 0.4;

/**
 * Fallback text color levels
 */
export const FALLBACK_TEXT_LEVEL_LIGHT = 950;
export const FALLBACK_TEXT_LEVEL_DARK = 50;

// =============================================================================
// VARIATION AND COLOR RELATIONSHIP PARAMETERS
// =============================================================================

/**
 * Variation level offsets for color relationships
 */
export const VARIATION_COLOR_OFFSETS = {
  lighter: -2,
  light: -1,
  dark: 1,
  darker: 2,
} as const;

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default hue shift mode
 */
export const DEFAULT_HUE_SHIFT_MODE = "natural" as const;

/**
 * Default color configuration
 */
export const DEFAULT_COLOR_CONFIG = {
  hueShiftMode: "natural" as HueShiftMode,
  includeTransparent: false,
  includeTextColors: false,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 500,
  enableChromaAdjustment: true,
};

/**
 * Default base color configuration
 */
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
 * Default random color configuration
 */
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
  chromaRange: [0.15, 0.25], // Moderate chroma (0-0.4)
  lightnessRange: [0.82, 0.47], // レベル300-700相当の明度範囲 (0-1 range)
  hueRange: [0, 360], // All hues
};

// =============================================================================
// FALLBACK VALUES
// =============================================================================

/**
 * Fallback color values
 */
export const FALLBACK_HEX_COLOR = "#000000";
