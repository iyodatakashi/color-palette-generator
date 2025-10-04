// constants.ts

import type {
  HueShiftMode,
  RandomColorConfig,
  CombinationType,
  BaseColorStrategy,
  ColorConfig,
} from "./types";

// =============================================================================
// 1. ランダムカラー生成
// =============================================================================

// Default random color configuration
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
  chromaRange: [0.15, 0.25], // Moderate chroma (0-0.4)
  lightnessRange: [0.82, 0.47], // レベル300-700相当の明度範囲 (0-1 range)
  hueRange: [0, 360], // All hues
};

// =============================================================================
// 2. コンビネーション生成
// =============================================================================

// Default combination configuration
export const DEFAULT_COMBINATION_CONFIG = {
  combinationType: "complementary" as CombinationType,
  baseColorStrategy: "harmonic" as BaseColorStrategy,
  includeTransparent: false,
  includeTextColors: false,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 500,
  baseTransparentOriginLevel: 950,
  hueShiftMode: "natural" as HueShiftMode,
  enableChromaLimit: true,
  maxChroma: 0.2,
};

// =============================================================================
// 3. パレット生成
// =============================================================================

// -----------------------------------------------------------------------------
// 3.1 Default color configuration for palette generation
// -----------------------------------------------------------------------------

// Default color configuration for primary and secondary palette generation
export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  id: "",
  prefix: "",
  seedColor: "",
  originLevel: 500,
  hueShiftMode: "natural" as HueShiftMode,
  includeTransparent: false,
  includeTextColors: false,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 500,
  enableLightnessAdjustment: true,
  enableChromaAdjustment: true,
};

// Default color configuration for base palette generation
export const DEFAULT_BASE_COLOR_CONFIG: ColorConfig = {
  id: "",
  prefix: "",
  seedColor: "",
  originLevel: 500,
  hueShiftMode: "fixed" as HueShiftMode,
  includeTransparent: false,
  includeTextColors: false,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 950,
  enableLightnessAdjustment: false,
  enableChromaAdjustment: true,
};

// -----------------------------------------------------------------------------
// 3.2 Lightness curve definitions
// -----------------------------------------------------------------------------

// Color scale level definitions
export const SCALE_LEVELS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];
export const MIN_LEVEL = 0;
export const MAX_LEVEL = 1000;

// Lightness scale boundaries
export const MAX_LIGHTNESS = 1.0;
export const MIN_LIGHTNESS = 0.2;

// Default lightness for level 500 (middle of the scale)
export const DEFAULT_LEVEL_500_LIGHTNESS = 0.64;

// Sigmoid function parameters for lightness distribution
export const DEFAULT_K_SIGNED = 0.18; // Sigmoid steepness
export const DEFAULT_V_BASE = 2.0; // Asymmetric base
export const DEFAULT_K_MIN = 1e-6; // Minimum slope guard
export const SIGMOID_X_RANGE = 10; // Normalization range for x values
export const SIGMOID_EPSILON = 1e-12; // Small value for division safety

// -----------------------------------------------------------------------------
// 3.3 Chroma curve definitions
// -----------------------------------------------------------------------------

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

// Base color generation parameters
export const BASE_COLOR_SEED_CHROMA = 0.025;
export const BASE_COLOR_NEUTRAL_CHROMA = 0.0;

// -----------------------------------------------------------------------------
// 3.4 Hue shift parameters
// -----------------------------------------------------------------------------

// Default hue shift mode
export const DEFAULT_HUE_SHIFT_MODE = "natural" as const;

// Max hue shift
export const MAX_HUE_SHIFT = 50;

// Hue shift direction offset degrees
export const TEMPERATURE_DIRECTION_OFFSET_DEGREES = 45;

// =============================================================================
// 4. バリエーションカラー生成
// =============================================================================

// -----------------------------------------------------------------------------
// 4.1 Transparent color definitions
// -----------------------------------------------------------------------------

// Alpha value boundaries
export const MIN_ALPHA = 0.1;
export const MAX_ALPHA = 1.0;

// -----------------------------------------------------------------------------
// 4.2 Text color definitions
// -----------------------------------------------------------------------------

// Text color lightness thresholds
export const TEXT_LIGHTNESS_ON_LIGHT = 0.6;
export const TEXT_LIGHTNESS_ON_DARK = 0.4;

// Fallback text color levels
export const FALLBACK_TEXT_LEVEL_LIGHT = 950;
export const FALLBACK_TEXT_LEVEL_DARK = 50;

// -----------------------------------------------------------------------------
// 4.3 Text color definitions
// -----------------------------------------------------------------------------

// Variation level offsets for color relationships
export const VARIATION_COLOR_OFFSETS = {
  lighter: -2,
  light: -1,
  dark: 1,
  darker: 2,
} as const;

// 3.2 パレット生成デフォルト設定

// =============================================================================
// 4. その他共通
// =============================================================================

// -----------------------------------------------------------------------------
// Fallback values
// -----------------------------------------------------------------------------

// Fallback hex color
export const FALLBACK_HEX_COLOR = "#000000";

// Fallback value when max chroma search fails for a specific hue
export const FALLBACK_MAX_CHROMA_FOR_HUE_SEARCH = 0.2;
