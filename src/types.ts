// types.ts

// =============================================================================
// Color Palette Generation Library - Type Definitions
// =============================================================================

// =============================================================================
// Basic Library Interfaces
// =============================================================================

/**
 * Color palette type definition (output)
 */
/**
 * Color configuration type definition (input)
 */
export type ColorConfig = {
  id: string;
  prefix: string;
  color: string;
  hueShiftMode?: HueShiftMode;
  lightnessMethod?: LightnessMethod;
  includeTransparent?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  includeTextColors?: boolean;
};

export type Palette = {
  [key: string]: string;
};

// =============================================================================
// Color Space Type Definitions
// =============================================================================

/**
 * RGB color type definition
 */
export type RGB = {
  r: number;
  g: number;
  b: number;
};

/**
 * HSL color type definition
 */
export type HSL = {
  h: number;
  s: number;
  l: number;
};

// =============================================================================
// Lightness Calculation Related Type Definitions
// =============================================================================

/**
 * Lightness calculation method type definition
 */
export type LightnessMethod =
  | "hybrid" // Balanced lightness (recommended)
  | "hsl" // HSL lightness (consistency focused)
  | "perceptual" // Perceptual lightness (accuracy focused)
  | "average"; // RGB average lightness (simple)

// =============================================================================
// Hue Shift Related Type Definitions
// =============================================================================

/**
 * Hue shift mode type definition
 */
export type HueShiftMode = "fixed" | "natural" | "unnatural";

// types.ts に追加

// =============================================================================
// Color Combination Related Type Definitions
// =============================================================================

/**
 * Color combination types
 */
export type CombinationType =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "splitComplementary"
  | "doubleComplementary"
  | "doubleComplementaryReverse"
  | "triadic"
  | "tetradic";

/**
 * Base color strategy
 */
export type BaseColorStrategy = "harmonic" | "contrasting" | "neutral";

/**
 * Color suggestion configuration
 */
export type CombinationConfig = {
  primaryColor: string;
  combinationType?: CombinationType;
  lightnessMethod?: LightnessMethod;
  baseColorStrategy?: BaseColorStrategy;
};

/**
 * Suggestion result (ColorConfig array)
 */
export type Combination = ColorConfig[];

// =============================================================================
// Random Color Generation Related Type Definitions
// =============================================================================

/**
 * Random primary color generation configuration options
 */
export type RandomColorConfig = {
  /** Saturation range [min, max] (0-100) */
  saturationRange?: [number, number];
  /** Target lightness (0-100) */
  lightnessRange?: [number, number];
  /** Lightness calculation method */
  lightnessMethod?: LightnessMethod;
  /** Hue limitation range [min, max] (0-360) */
  hueRange?: [number, number];
};

/**
 * Generated color information
 */
export type GeneratedColor = {
  hsl: HSL;
  rgb: RGB;
  hex: string;
  actualLightness: number;
};
