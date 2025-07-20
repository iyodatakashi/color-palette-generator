// hueShift.ts

import { hexToHSL } from "./colorUtils";
import type { ColorConfig, HueShiftMode } from "./types";

// =============================================================================
// Hue Shift Calculation Functions
// =============================================================================

/**
 * Calculate hue shift
 */
export const calculateHueShift = ({
  baseHue,
  baseLightness,
  targetLightness,
  adjustedLightnessScale,
  hueShiftMode,
}: {
  baseHue: number;
  baseLightness: number;
  targetLightness: number;
  adjustedLightnessScale: Record<number, number>;
  hueShiftMode: HueShiftMode;
}): number => {
  const MAX_HUE_SHIFT = 30;

  // No change in fixed mode
  if (hueShiftMode === "fixed") {
    return baseHue;
  }

  const lightnessDiff = targetLightness - baseLightness;

  // Use perception-based dynamic calculation
  const hueBasedIntensity = calculateHueIntensityByHue(baseHue);
  const lightnessBasedIntensity = calculateHueIntensityByLightness(
    lightnessDiff,
    adjustedLightnessScale
  );

  // Get shift amount & direction
  let hueShift = hueBasedIntensity * lightnessBasedIntensity * MAX_HUE_SHIFT;

  // Reverse direction in unnatural mode
  if (hueShiftMode === "unnatural") {
    hueShift = -hueShift;
  }

  const newHue = baseHue + hueShift;
  return normalizeHue(newHue);
};

/**
 * Calculate hue shift intensity based on hue
 */
export const calculateHueIntensityByHue = (hue: number): number => {
  const normalizedHue = normalizeHue(hue);
  const radians = (normalizedHue * Math.PI) / 180;

  // Approximation of perceptual sensitivity curve based on MacAdam ellipse
  // High at red (0°) and blue (240°), low around yellow-green (60°)
  const perceptualSensitivity =
    0.3 + (0.5 * (1 + Math.cos(radians - Math.PI / 3))) / 2;

  // Direction of hue shift due to temperature change
  // Warm colors (0-180°): bright→yellow (+), dark→magenta (-)
  // Cool colors (180-360°): bright→green (-), dark→blue/purple (+)
  const temperatureDirection = Math.cos(radians);

  // Combine perceptual sensitivity and temperature direction
  return perceptualSensitivity * temperatureDirection;
};

/**
 * Calculate hue shift intensity based on lightness difference
 */
const calculateHueIntensityByLightness = (
  lightnessDiff: number,
  adjustedLightnessScale: Record<number, number>
): number => {
  const minLightness = Math.min(...Object.values(adjustedLightnessScale));
  const maxLightness = Math.max(...Object.values(adjustedLightnessScale));
  const actualRange = maxLightness - minLightness;

  // Normalize while preserving sign (-1 to +1 range)
  const normalizedDiff = lightnessDiff / actualRange;
  return Math.max(-1, Math.min(normalizedDiff, 1));
};

/**
 * Normalize hue to 0-360 range
 */
export const normalizeHue = (hue: number): number => {
  while (hue < 0) hue += 360;
  while (hue >= 360) hue -= 360;
  return hue;
};

// =============================================================================
// Get Hue Shift Direction Explanation
// =============================================================================

/**
 * Get hue shift direction explanation
 */
export const getHueShiftExplanation = ({
  colorConfig,
}: {
  colorConfig: ColorConfig;
}): {
  category: string;
  lighterDirection: string;
  darkerDirection: string;
  lighterSign: string;
  darkerSign: string;
} => {
  const { hueShiftMode } = colorConfig;
  const baseHSL = hexToHSL(colorConfig.color);
  const hueCategory = getHueCategory(baseHSL.h);
  const category = getHueCategoryJapanese(baseHSL.h);

  // Fixed mode has no change
  if (hueShiftMode === "fixed") {
    return {
      category,
      lighterDirection: "変化なし",
      darkerDirection: "変化なし",
      lighterSign: "",
      darkerSign: "",
    };
  }

  // Get intensity value from dynamic calculation
  const intensity = calculateHueIntensityByHue(baseHSL.h);
  const directions =
    HUE_DIRECTION_EXPLANATION_MAP[
      hueCategory as keyof typeof HUE_DIRECTION_EXPLANATION_MAP
    ];

  // Determine direction from signed intensity value
  const isPositiveIntensity = intensity > 0;
  const naturalConfig = {
    lighterSign: isPositiveIntensity ? "+" : "-",
    darkerSign: isPositiveIntensity ? "-" : "+",
    lighterDirection: directions.lighter,
    darkerDirection: directions.darker,
  };

  // Reverse sign and direction in unnatural mode
  if (hueShiftMode === "unnatural") {
    return {
      category,
      lighterSign: naturalConfig.lighterSign === "+" ? "-" : "+",
      darkerSign: naturalConfig.darkerSign === "+" ? "-" : "+",
      lighterDirection: naturalConfig.darkerDirection,
      darkerDirection: naturalConfig.lighterDirection,
    };
  }

  return { category, ...naturalConfig };
};

/**
 * Determine hue category
 */
export const getHueCategory = (hue: number): string => {
  const normalizedHue = normalizeHue(hue);

  if (normalizedHue < 30 || normalizedHue >= 330) return "red";
  if (normalizedHue < 60) return "orange";
  if (normalizedHue < 90) return "yellow";
  if (normalizedHue < 150) return "green";
  if (normalizedHue < 210) return "cyan";
  if (normalizedHue < 270) return "blue";
  return "purple";
};

/**
 * Get Japanese name of hue category
 */
export const getHueCategoryJapanese = (hue: number): string => {
  const category = getHueCategory(hue);
  const categoryNames = {
    red: "赤系",
    orange: "オレンジ系",
    yellow: "黄系",
    green: "緑系",
    cyan: "シアン系",
    blue: "青系",
    purple: "紫系",
  };
  return categoryNames[category as keyof typeof categoryNames];
};

// Master data for hue direction explanation
const HUE_DIRECTION_EXPLANATION_MAP = {
  red: { lighter: "オレンジ/黄色寄り", darker: "深い赤/マゼンタ寄り" },
  orange: { lighter: "黄色寄り", darker: "赤寄り" },
  yellow: { lighter: "緑寄り", darker: "オレンジ寄り" },
  green: { lighter: "黄緑寄り", darker: "青緑寄り" },
  cyan: { lighter: "緑寄り", darker: "青寄り" },
  blue: { lighter: "シアン寄り", darker: "紫寄り" },
  purple: { lighter: "ピンク/マゼンタ寄り", darker: "深い紫/青寄り" },
} as const;
