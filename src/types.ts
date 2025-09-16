// types.ts

// =============================================================================
// Palette Generation Types
// =============================================================================

// Color configuration (input)
export type ColorConfig = {
  prefix: string;
  color: string;
  id?: string; // Optional for internal unique management
  hueShiftMode?: HueShiftMode;
  lightnessMethod?: LightnessMethod;
  includeTransparent?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  includeTextColors?: boolean;
  enableSaturationAdjustment?: boolean; // Whether to apply saturation adjustment in palette generation
};

// Normalized color configuration (internal use)
export type NormalizedColorConfig = ColorConfig & {
  color: string;
  lightnessMethod: LightnessMethod;
  hueShiftMode: HueShiftMode;
  includeTransparent: boolean;
  includeTextColors: boolean;
  bgColorLight: string;
  bgColorDark: string;
  transparentOriginLevel: number;
  enableSaturationAdjustment: boolean;
};

// Color palette (output)
export type Palette = {
  [key: string]: string;
};

// =============================================================================
// Hue Palette Generation Types
// =============================================================================

// Hue palette configuration (input)
export type HuePaletteConfig = {
  color: string;
  divisions?: number;
  lightnessMethod?: LightnessMethod;
  hueShiftMode?: HueShiftMode;
  includeTransparent?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  includeTextColors?: boolean;
};

// =============================================================================
// Color Combination Types
// =============================================================================

// Color combination configuration (input)
export type CombinationConfig = {
  primaryColor: string;
  combinationType?: CombinationType;
  lightnessMethod?: LightnessMethod;
  baseColorStrategy?: BaseColorStrategy;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  baseTransparentOriginLevel?: number;
  transparentOriginLevel?: number;
};

// Color combination result (output)
export type Combination = ColorConfig[];

// Color combination types
export type CombinationType =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "splitComplementary"
  | "doubleComplementary"
  | "doubleComplementaryReverse"
  | "triadic"
  | "tetradic";

// Base color strategy
export type BaseColorStrategy = "harmonic" | "contrasting" | "neutral";

// =============================================================================
// Random Color Generation Types
// =============================================================================

// Random color generation configuration (input)
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

// Generated color (output)
export type GeneratedColor = {
  hsl: HSL;
  rgb: RGB;
  hex: string;
  actualLightness: number;
};

// =============================================================================
// Color Space Types
// =============================================================================

// RGB color type definition
export type RGB = {
  r: number;
  g: number;
  b: number;
};

// HSL color type definition
export type HSL = {
  h: number;
  s: number;
  l: number;
};

// =============================================================================
// Calculation Method Types
// =============================================================================

// Lightness calculation method type definition
export type LightnessMethod =
  | "hybrid" // Balanced lightness (recommended)
  | "hsl" // HSL lightness (consistency focused)
  | "perceptual" // Perceptual lightness (accuracy focused)
  | "average"; // RGB average lightness (simple)

// Hue shift mode type definition
export type HueShiftMode = "fixed" | "natural" | "unnatural";
