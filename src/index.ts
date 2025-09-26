// index.ts

// =============================================================================
// Color Palette Generation Library - Main Entry Point
// =============================================================================

// Palette generation features
export { generateColorPalette, resolveVariable } from "./palette";

// Color combination features
export { generateCombination, generateSameToneColor } from "./combination";

// Random color generation features
export { generateRandomPrimaryColor } from "./randomColor";

// Lightness calculation features
export {
  getLightness,
  generateLightnessScale,
  getLevelFromLightness,
  findClosestLevel,
} from "./lightness";

// Hue change features
// export { generateHuePalette, HUE_NAMES } from "./hue";

// Color utility features
export {
  oklchToHexPerceptual,
  oklchToHexAdjustChroma,
  oklchToHexAdjustLightness,
  oklchToRgbPerceptual,
  oklchToRgbAdjustChroma,
  oklchToRgbAdjustLightness,
  oklchGamutMappingPerceptual,
  oklchGamutMappingAdjustChroma,
  oklchGamutMappingAdjustLightness,
  calculateRelativeChroma,
} from "./colorUtils";

// Apply to DOM
export { applyColorPaletteToDom } from "./applyToDom";

// Constants
export {
  DEFAULT_COLOR_CONFIG,
  DEFAULT_BASE_COLOR_CONFIG,
  SCALE_LEVELS,
  DEFAULT_HUE_SHIFT_MODE,
  MIN_LEVEL,
  MAX_LEVEL,
  MIN_LIGHTNESS,
  MAX_LIGHTNESS,
  DEFAULT_LEVEL_500_LIGHTNESS,
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
  CombinationResults,
  CombinationResult,
} from "./types";
