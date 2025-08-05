// combination.ts

import { hexToHSL } from "./colorUtils";
import { getLightness, adjustToLightness } from "./lightness";
import { normalizeHue } from "./hueShift";
import { adjustColorToSameTone } from "./hue";
import type {
  ColorConfig,
  HSL,
  LightnessMethod,
  CombinationType,
  BaseColorStrategy,
  CombinationConfig,
  Combination,
} from "./types";
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
  const primaryHSL = hexToHSL(config.primaryColor);
  const lightnessMethod = config.lightnessMethod || "hybrid";
  const baseColorStrategy = config.baseColorStrategy || "harmonic";

  const baseColorConfig = generateBaseColorConfig({
    primaryHSL,
    lightnessMethod,
    strategy: baseColorStrategy,
    config,
  });
  const primaryColorConfig = {
    lightnessMethod,
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
    id: "primary",
    prefix: "primary",
    color: config.primaryColor,
  };
  const secondaryColorConfigs = generateSecondaryColorConfigs({
    primaryHSL,
    combinationType,
    lightnessMethod,
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
  primaryHSL,
  lightnessMethod = "hybrid",
  strategy = "harmonic",
  config,
}: {
  primaryHSL: HSL;
  lightnessMethod?: LightnessMethod;
  strategy?: BaseColorStrategy;
  config: CombinationConfig;
}): ColorConfig => {
  const baseColor = getBaseColor({ primaryHSL, lightnessMethod, strategy });

  return {
    lightnessMethod,
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
    id: "base",
    prefix: "base",
    color: baseColor,
  };
};

/**
 * Generate secondary color group Configs
 */
const generateSecondaryColorConfigs = ({
  primaryHSL,
  combinationType,
  lightnessMethod,
  primaryColor,
  config,
}: {
  primaryHSL: HSL;
  combinationType: CombinationType;
  lightnessMethod: LightnessMethod;
  primaryColor: string;
  config: CombinationConfig;
}): ColorConfig[] => {
  if (combinationType === "monochromatic") {
    return [];
  }

  const secondaryColors = getSecondaryColors({
    primaryHSL,
    combinationType,
    lightnessMethod,
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
        lightnessMethod,
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
  primaryHSL,
  lightnessMethod = "hybrid",
  strategy = "harmonic",
}: {
  primaryHSL: HSL;
  lightnessMethod?: LightnessMethod;
  strategy?: BaseColorStrategy;
}): string => {
  const targetLightness = STANDARD_LIGHTNESS_SCALE[500]; // 500 level equivalent
  const baseSaturation = Math.max(5, Math.min(15, primaryHSL.s * 0.1));

  const strategyMap: Record<
    BaseColorStrategy,
    { baseHue: number; finalSaturation: number }
  > = {
    harmonic: { baseHue: primaryHSL.h, finalSaturation: baseSaturation },
    contrasting: {
      baseHue: normalizeHue(primaryHSL.h + 180),
      finalSaturation: baseSaturation,
    },
    neutral: { baseHue: 0, finalSaturation: 0 },
  };

  const { baseHue, finalSaturation } =
    strategyMap[strategy] || strategyMap.harmonic;

  return adjustToLightness({
    h: baseHue,
    s: finalSaturation,
    targetLightness,
    lightnessMethod: lightnessMethod,
  });
};

/**
 * Get secondary colors (final color strings)
 */
const getSecondaryColors = ({
  primaryHSL,
  combinationType,
  lightnessMethod,
  primaryColor,
}: {
  primaryHSL: HSL;
  combinationType: CombinationType;
  lightnessMethod: LightnessMethod;
  primaryColor: string;
}): {
  secondary?: string;
  secondary2?: string;
  secondary3?: string;
} => {
  const { h: primaryHue } = primaryHSL;

  const combinationMap: Record<
    CombinationType,
    {
      secondary?: HSL;
      secondary2?: HSL;
      secondary3?: HSL;
    }
  > = {
    monochromatic: {
      secondary: primaryHSL,
    },
    analogous: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 30) },
      secondary2: { ...primaryHSL, h: normalizeHue(primaryHue - 30) },
    },
    complementary: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
    },
    splitComplementary: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 150) },
      secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 210) },
    },
    doubleComplementary: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 30) },
      secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
      secondary3: { ...primaryHSL, h: normalizeHue(primaryHue + 210) },
    },
    doubleComplementaryReverse: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue - 30) },
      secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
      secondary3: { ...primaryHSL, h: normalizeHue(primaryHue + 150) },
    },
    triadic: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 120) },
      secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 240) },
    },
    tetradic: {
      secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 90) },
      secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
      secondary3: { ...primaryHSL, h: normalizeHue(primaryHue + 270) },
    },
  };

  const hslValues =
    combinationMap[combinationType] || combinationMap.complementary;

  const result: {
    secondary?: string;
    secondary2?: string;
    secondary3?: string;
  } = {};

  const keys = ["secondary", "secondary2", "secondary3"] as const;
  for (const key of keys) {
    const hsl = hslValues[key];
    if (hsl) {
      result[key] = adjustColorToSameTone({
        color: primaryColor,
        targetHue: hsl.h,
        lightnessMethod,
      });
    }
  }

  return result;
};

// =============================================================================
// Color Adjustment
// =============================================================================
