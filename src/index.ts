// index.ts

// =============================================================================
// Color Palette Generation Library - Main Entry Point
// =============================================================================

// Palette generation features
export { generateColorPalette, resolveVariable } from "./palette";

// Color combination features
export { generateCombination } from "./combination";

// Random color generation features
export { generateRandomPrimaryColor } from "./randomColor";

// Lightness calculation features
export {
  getLightness,
  adjustToLightness,
  calculateEvenScale,
} from "./lightness";

// Chroma calculation features
export {
  getChroma,
  getTheoreticalChromaCoefficient,
  adjustChromaForLightness,
} from "./chroma";

// Hue change features
export { adjustColorToSameTone, generateHuePalette, HUE_NAMES } from "./hue";

// Apply to DOM
export { applyColorPaletteToDom } from "./applyToDom";

// Constants
export {
  DEFAULT_COLOR_CONFIG,
  DEFAULT_BASE_COLOR_CONFIG,
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
  PERCEPTUAL_LIGHTNESS_SCALE,
  DEFAULT_LIGHTNESS_METHOD,
  DEFAULT_HUE_SHIFT_MODE,
  MIN_LEVEL,
  MAX_LEVEL,
  MIN_LIGHTNESS,
  MAX_LIGHTNESS,
} from "./constants";

// Type definitions
export type {
  Palette,
  ColorConfig,
  HueShiftMode,
  CombinationType,
  BaseColorStrategy,
  Combination,
  CombinationConfig,
  RandomColorConfig,
  GeneratedColor,
} from "./types";
