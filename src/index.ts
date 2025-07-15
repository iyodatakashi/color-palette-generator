// index.ts

// =============================================================================
// Color Palette Generation Library - Main Entry Point
// =============================================================================

// Palette generation features
export { generateColorPalette, generateMultipleColorPalette } from "./palette";

// Color combination features
export { generateCombination } from "./combination";

// Random color generation features
export { generateRandomPrimaryColor } from "./randomColor";

// Lightness calculation features
export { getLightness, adjustToLightness } from "./lightness";

// Basic color utilities
export { hexToRGB, rgbToHex, hexToHSL, hslToRGB, rgbToHSL } from "./colorUtils";

// Apply to DOM
export { applyColorPaletteToDom } from "./applyToDom";

// Constants
export {
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
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
  RGB,
  HSL,
  LightnessMethod,
  HueShiftMode,
  CombinationType,
  BaseColorStrategy,
  Combination,
  CombinationConfig,
  RandomColorConfig,
  GeneratedColor,
} from "./types";
