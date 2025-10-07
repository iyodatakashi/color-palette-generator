// types.ts

import type { Oklch, Rgb } from "culori";

// =============================================================================
// Palette Generation Types
// =============================================================================

// Color configuration (input)
export type ColorConfig = {
  id?: string;
  prefix: string;
  seedOklch?: Oklch | null;
  seedColor: string;
  originLevel: number;
  hueShiftMode?: HueShiftMode;
  includeTransparent?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  includeTextColors?: boolean;
  enableChromaAdjustment?: boolean; // Whether to apply chroma adjustment in palette generation
  enableLightnessAdjustment?: boolean; // Whether to apply K-value lightness adjustment in palette generation
  enableChromaLimit?: boolean; // Whether to limit maximum chroma in palette generation
  maxChroma?: number; // Maximum chroma value when enableChromaLimit is true (0-1)
};

// Color palette (output)
export type Palette = {
  [key: string]: string;
};

// =============================================================================
// Color Combination Types
// =============================================================================

// Color combination configuration (input)
export type CombinationConfig = {
  seedColor: string;
  combinationType?: CombinationType;
  baseColorStrategy?: BaseColorStrategy;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  baseTransparentOriginLevel?: number;
  hueShiftMode?: HueShiftMode;
  enableChromaLimit?: boolean; // Whether to limit high chroma in seed color
  maxChroma?: number; // Maximum chroma value for seed color when enableChromaLimit is true (0-1)
};

// Color combination result (output) - ColorConfig only
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
  /** Chroma range [min, max] (0-1) */
  chromaRange?: [number, number];
  /** Target lightness (0-1) */
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
// Swatch Generation Types
// =============================================================================

// Swatch palette configuration (input)
export type SwatchConfig = {
  seedColor: string;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  divisions?: number;
  hueShiftMode?: HueShiftMode;
  enableChromaLimit?: boolean; // Whether to limit high chroma in seed color
  maxChroma?: number; // Maximum chroma value for seed color when enableChromaLimit is true (0-1)
};

// =============================================================================
// Hue Shift Mode Tpes
// =============================================================================

// Hue shift mode type definition
export type HueShiftMode = "fixed" | "natural" | "unnatural";
