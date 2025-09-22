// types.ts

import type { Oklch, Rgb } from "culori";

// =============================================================================
// Palette Generation Types
// =============================================================================

// Color configuration (input)
export type ColorConfig = {
  prefix: string;
  color: string;
  id?: string; // Optional for internal unique management
  hueShiftMode?: HueShiftMode;
  includeTransparent?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  includeTextColors?: boolean;
  enableChromaAdjustment?: boolean; // Whether to apply chroma adjustment in palette generation
  combinationHueShift?: number; // Hue shift for combination colors (degrees)
};

// Normalized color configuration (internal use)
export type NormalizedColorConfig = ColorConfig & {
  color: string;
  hueShiftMode: HueShiftMode;
  includeTransparent: boolean;
  includeTextColors: boolean;
  bgColorLight: string;
  bgColorDark: string;
  transparentOriginLevel: number;
  enableChromaAdjustment: boolean;
  combinationHueShift?: number;
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
  baseColorStrategy?: BaseColorStrategy;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  baseTransparentOriginLevel?: number;
  transparentOriginLevel?: number;
};

// Color combination result (output) - New implementation with generated palettes
export type GeneratedColorPalette = {
  id?: string;
  prefix: string;
  color: string; // Representative color
  palette: Palette; // Generated color palette
  hueShiftMode?: HueShiftMode;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  enableChromaAdjustment?: boolean;
};

export type CombinationResult = GeneratedColorPalette[];

// Legacy type (deprecated)
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
  /** Chroma range [min, max] (0-100) */
  chromaRange?: [number, number];
  /** Target lightness (0-100) */
  lightnessRange?: [number, number];
  /** Lightness calculation method */
  /** Hue limitation range [min, max] (0-360) */
  hueRange?: [number, number];
};

// Generated color (output)
export type GeneratedColor = {
  oklch: Oklch;
  rgb: Rgb;
  hex: string;
  actualLightness: number;
};

// =============================================================================
// Calculation Method Types
// =============================================================================

// Hue shift mode type definition
export type HueShiftMode = "fixed" | "natural" | "unnatural";
