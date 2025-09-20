// combination.ts

import * as culori from "culori";
import { normalizeHue } from "./hueShift";
import { adjustColorToSameTone } from "./hue";
import type {
  ColorConfig,
  CombinationType,
  BaseColorStrategy,
  CombinationConfig,
  Combination,
} from "./types";
import type { Oklch } from "culori";
import {
  STANDARD_LIGHTNESS_SCALE,
  DEFAULT_COLOR_CONFIG,
  DEFAULT_BASE_COLOR_CONFIG,
} from "./constants";

// =============================================================================
// Color Combination Generation
// =============================================================================

/**
 * Generate harmonious color combination from primary color
 */
export const generateCombination = (config: CombinationConfig): Combination => {
  const combinationType = config.combinationType || "complementary";
  // Parse and convert primary color to OKLCH
  const primaryColorObj = culori.parse(config.primaryColor);
  if (!primaryColorObj) {
    throw new Error("Invalid primary color");
  }

  const primaryOKLCH = culori.converter("oklch")(primaryColorObj);
  if (!primaryOKLCH) {
    throw new Error("Failed to convert color to OKLCH");
  }
  const baseColorStrategy = config.baseColorStrategy || "harmonic";
  // Use default chroma adjustment settings for each color type

  const baseColorConfig = generateBaseColorConfig({
    primaryOKLCH,
    strategy: baseColorStrategy,
    config,
  });
  const primaryColorConfig = {
    hueShiftMode: "natural" as const,
    includeTransparent:
      config.includeTransparent ?? DEFAULT_COLOR_CONFIG.includeTransparent,
    includeTextColors:
      config.includeTextColors ?? DEFAULT_COLOR_CONFIG.includeTextColors,
    bgColorLight: config.bgColorLight ?? DEFAULT_COLOR_CONFIG.bgColorLight,
    bgColorDark: config.bgColorDark ?? DEFAULT_COLOR_CONFIG.bgColorDark,
    transparentOriginLevel:
      config.transparentOriginLevel ??
      DEFAULT_COLOR_CONFIG.transparentOriginLevel,
    enableChromaAdjustment: DEFAULT_COLOR_CONFIG.enableChromaAdjustment,
    id: "primary",
    prefix: "primary",
    color: config.primaryColor,
  };
  const secondaryColorConfigs = generateSecondaryColorConfigs({
    primaryOKLCH,
    combinationType,
    primaryColor: config.primaryColor,
    config,
  });

  return [baseColorConfig, primaryColorConfig, ...secondaryColorConfigs];
};

// =============================================================================
// ColorConfig Construction
// =============================================================================

/**
 * Generate base color Config
 */
const generateBaseColorConfig = ({
  primaryOKLCH,
  strategy = "harmonic",
  config,
}: {
  primaryOKLCH: Oklch;
  strategy?: BaseColorStrategy;
  config: CombinationConfig;
}): ColorConfig => {
  const baseColor = getBaseColor({
    primaryOKLCH,
    strategy,
    config,
  });

  return {
    hueShiftMode: "fixed" as const,
    includeTransparent:
      config.includeTransparent ?? DEFAULT_BASE_COLOR_CONFIG.includeTransparent,
    includeTextColors:
      config.includeTextColors ?? DEFAULT_BASE_COLOR_CONFIG.includeTextColors,
    bgColorLight: config.bgColorLight ?? DEFAULT_BASE_COLOR_CONFIG.bgColorLight,
    bgColorDark: config.bgColorDark ?? DEFAULT_BASE_COLOR_CONFIG.bgColorDark,
    transparentOriginLevel:
      config.baseTransparentOriginLevel ??
      DEFAULT_BASE_COLOR_CONFIG.transparentOriginLevel,
    enableChromaAdjustment: DEFAULT_BASE_COLOR_CONFIG.enableChromaAdjustment,
    id: "base",
    prefix: "base",
    color: baseColor,
  };
};

/**
 * Generate secondary color group Configs
 */
const generateSecondaryColorConfigs = ({
  primaryOKLCH,
  combinationType,
  primaryColor,
  config,
}: {
  primaryOKLCH: Oklch;
  combinationType: CombinationType;
  primaryColor: string;
  config: CombinationConfig;
}): ColorConfig[] => {
  if (combinationType === "monochromatic") {
    return [];
  }

  const secondaryColors = getSecondaryColors({
    primaryOKLCH,
    combinationType,
    primaryColor,
  });
  const configs: ColorConfig[] = [];

  const secondaryColorMap = [
    { id: "secondary", prefix: "secondary", color: secondaryColors.secondary }, // Second
    {
      id: "secondary2",
      prefix: "secondary2",
      color: secondaryColors.secondary2,
    }, // Third
    {
      id: "secondary3",
      prefix: "secondary3",
      color: secondaryColors.secondary3,
    }, // Fourth
  ];

  for (const { id, color, prefix } of secondaryColorMap) {
    if (color) {
      configs.push({
        hueShiftMode: "natural" as const,
        includeTransparent:
          config.includeTransparent ?? DEFAULT_COLOR_CONFIG.includeTransparent,
        includeTextColors:
          config.includeTextColors ?? DEFAULT_COLOR_CONFIG.includeTextColors,
        bgColorLight: config.bgColorLight ?? DEFAULT_COLOR_CONFIG.bgColorLight,
        bgColorDark: config.bgColorDark ?? DEFAULT_COLOR_CONFIG.bgColorDark,
        transparentOriginLevel:
          config.transparentOriginLevel ??
          DEFAULT_COLOR_CONFIG.transparentOriginLevel,
        enableChromaAdjustment: DEFAULT_COLOR_CONFIG.enableChromaAdjustment,
        id,
        prefix,
        color,
      });
    }
  }

  return configs;
};

// =============================================================================
// Color Generation
// =============================================================================

/**
 * Get base color (final color string)
 */
const getBaseColor = ({
  primaryOKLCH,
  strategy = "harmonic",
  config,
}: {
  primaryOKLCH: Oklch;
  strategy?: BaseColorStrategy;
  config: CombinationConfig;
}): string => {
  const targetLightness = STANDARD_LIGHTNESS_SCALE[500]; // 500 level equivalent

  // Calculate base chroma (low chroma for base colors)
  const baseChroma = Math.max(
    0.02,
    Math.min(0.08, (primaryOKLCH.c || 0) * 0.1)
  );

  const strategyMap: Record<
    BaseColorStrategy,
    { baseHue: number; finalChroma: number }
  > = {
    harmonic: { baseHue: primaryOKLCH.h || 0, finalChroma: baseChroma },
    contrasting: {
      baseHue: normalizeHue((primaryOKLCH.h || 0) + 180),
      finalChroma: baseChroma,
    },
    neutral: { baseHue: 0, finalChroma: 0.01 },
  };

  const { baseHue, finalChroma } =
    strategyMap[strategy] || strategyMap.harmonic;

  // Create OKLCH color with target lightness
  const newOKLCHObj = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: finalChroma,
    h: baseHue,
  };

  // Convert OKLCH to HEX color
  const newRGB = culori.converter("rgb")(newOKLCHObj);
  if (!newRGB) {
    return "#000000";
  }
  return culori.formatHex(newRGB);
};

/**
 * Get secondary colors (final color strings)
 */
const getSecondaryColors = ({
  primaryOKLCH,
  combinationType,
  primaryColor,
}: {
  primaryOKLCH: Oklch;
  combinationType: CombinationType;
  primaryColor: string;
}): {
  secondary?: string;
  secondary2?: string;
  secondary3?: string;
} => {
  const primaryHue = primaryOKLCH.h || 0;

  const combinationMap: Record<
    CombinationType,
    {
      secondary?: number;
      secondary2?: number;
      secondary3?: number;
    }
  > = {
    monochromatic: {
      secondary: primaryHue,
    },
    analogous: {
      secondary: normalizeHue(primaryHue + 30),
      secondary2: normalizeHue(primaryHue - 30),
    },
    complementary: {
      secondary: normalizeHue(primaryHue + 180),
    },
    splitComplementary: {
      secondary: normalizeHue(primaryHue + 150),
      secondary2: normalizeHue(primaryHue + 210),
    },
    doubleComplementary: {
      secondary: normalizeHue(primaryHue + 30),
      secondary2: normalizeHue(primaryHue + 180),
      secondary3: normalizeHue(primaryHue + 210),
    },
    doubleComplementaryReverse: {
      secondary: normalizeHue(primaryHue - 30),
      secondary2: normalizeHue(primaryHue + 180),
      secondary3: normalizeHue(primaryHue + 150),
    },
    triadic: {
      secondary: normalizeHue(primaryHue + 120),
      secondary2: normalizeHue(primaryHue + 240),
    },
    tetradic: {
      secondary: normalizeHue(primaryHue + 90),
      secondary2: normalizeHue(primaryHue + 180),
      secondary3: normalizeHue(primaryHue + 270),
    },
  };

  const hueValues =
    combinationMap[combinationType] || combinationMap.complementary;

  const result: {
    secondary?: string;
    secondary2?: string;
    secondary3?: string;
  } = {};

  const keys = ["secondary", "secondary2", "secondary3"] as const;
  for (const key of keys) {
    const targetHue = hueValues[key];
    if (targetHue !== undefined) {
      result[key] = adjustColorToSameTone({
        color: primaryColor,
        targetHue,
      });
    }
  }

  return result;
};

// =============================================================================
// Color Adjustment
// =============================================================================
