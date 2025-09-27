// combination.ts

import * as culori from "culori";
import { normalizeHue } from "./hueShift";
import {
  oklchToHexAdjustChroma,
  oklchToHexPerceptual,
  normalizeOklch,
  hexToOklch,
} from "./colorUtils";
import { findClosestLevel, getLightness } from "./lightness";
import {
  DEFAULT_LEVEL_500_LIGHTNESS,
  BASE_COLOR_CHROMA_MIN,
  BASE_COLOR_CHROMA_MAX,
  BASE_COLOR_CHROMA_MULTIPLIER,
  BASE_COLOR_NEUTRAL_CHROMA,
  DEFAULT_COMBINATION_CONFIG,
} from "./constants";
import type {
  ColorConfig,
  CombinationType,
  BaseColorStrategy,
  CombinationConfig,
  Combination,
} from "./types";
import type { Oklch } from "culori";
import { DEFAULT_COLOR_CONFIG, DEFAULT_BASE_COLOR_CONFIG } from "./constants";

// =============================================================================
// Color Combination Generation
// =============================================================================

/**
 * Generate harmonious color combination from primary color
 */
export const generateCombination = (
  combinationConfig: CombinationConfig
): Combination => {
  const combinationType = combinationConfig.combinationType || "complementary";
  let seedOklch = hexToOklch(combinationConfig.seedColor);
  if (!seedOklch) {
    throw new Error("Failed to convert color to OKLCH");
  }

  // Create adjusted seed OKLCH with optional chroma limit
  let adjustedSeedOklch = seedOklch;
  const enableChromaLimit =
    combinationConfig.enableChromaLimit ??
    DEFAULT_COMBINATION_CONFIG.enableChromaLimit;
  const maxChroma =
    combinationConfig.maxChroma ?? DEFAULT_COMBINATION_CONFIG.maxChroma;
  if (enableChromaLimit && seedOklch.c > maxChroma) {
    adjustedSeedOklch = {
      ...seedOklch,
      c: maxChroma,
    };
  }

  const baseColorConfig = getBaseColorConfig({
    primaryOklch: adjustedSeedOklch,
    combinationConfig,
  });
  const primaryColorConfig = getPrimaryColorConfig({
    primaryOklch: adjustedSeedOklch,
    combinationConfig,
  });

  // Generate base and primary palettes first

  // Find primary base level using findClosestLevel
  const primaryOriginLevel = findClosestLevel({
    seedLightness: getLightness(combinationConfig.seedColor),
    seedChroma: adjustedSeedOklch.c,
    seedHue: adjustedSeedOklch.h,
  });

  // Generate secondary palettes
  const secondaryConfigs = generateSecondaryConfigss({
    primaryOklch: adjustedSeedOklch,
    primaryOriginLevel,
    combinationType,
    combinationConfig,
  });

  // Add secondary color configs to results
  return [baseColorConfig, primaryColorConfig, ...secondaryConfigs];
};

// =============================================================================
// ColorConfig Construction
// =============================================================================

/**
 * Generate base color Config
 */
const getBaseColorConfig = ({
  primaryOklch,
  combinationConfig,
}: {
  primaryOklch: Oklch;
  combinationConfig: CombinationConfig;
}): ColorConfig => {
  const baseColor = getBaseColor({
    primaryOklch,
    strategy: combinationConfig.baseColorStrategy,
  });

  return {
    id: "base",
    prefix: "base",
    seedColor: oklchToHexAdjustChroma(baseColor), // あとで直す
    seedOklch: baseColor,
    hueShiftMode: DEFAULT_BASE_COLOR_CONFIG.hueShiftMode,
    includeTransparent:
      combinationConfig.includeTransparent ??
      DEFAULT_BASE_COLOR_CONFIG.includeTransparent,
    includeTextColors:
      combinationConfig.includeTextColors ??
      DEFAULT_BASE_COLOR_CONFIG.includeTextColors,
    bgColorLight:
      combinationConfig.bgColorLight ?? DEFAULT_BASE_COLOR_CONFIG.bgColorLight,
    bgColorDark:
      combinationConfig.bgColorDark ?? DEFAULT_BASE_COLOR_CONFIG.bgColorDark,
    transparentOriginLevel:
      combinationConfig.baseTransparentOriginLevel ??
      DEFAULT_BASE_COLOR_CONFIG.transparentOriginLevel,
    enableChromaAdjustment: DEFAULT_BASE_COLOR_CONFIG.enableChromaAdjustment,
  };
};

/**
 * Generate base color Config
 */
const getPrimaryColorConfig = ({
  primaryOklch,
  combinationConfig,
}: {
  primaryOklch: Oklch;
  combinationConfig: CombinationConfig;
}): ColorConfig => {
  return {
    id: "primary",
    prefix: "primary",
    seedColor: oklchToHexAdjustChroma(primaryOklch), // あとで直す
    seedOklch: primaryOklch,
    hueShiftMode:
      combinationConfig.hueShiftMode ?? DEFAULT_COLOR_CONFIG.hueShiftMode,
    includeTransparent:
      combinationConfig.includeTransparent ??
      DEFAULT_COLOR_CONFIG.includeTransparent,
    includeTextColors:
      combinationConfig.includeTextColors ??
      DEFAULT_COLOR_CONFIG.includeTextColors,
    bgColorLight:
      combinationConfig.bgColorLight ?? DEFAULT_COLOR_CONFIG.bgColorLight,
    bgColorDark:
      combinationConfig.bgColorDark ?? DEFAULT_COLOR_CONFIG.bgColorDark,
    transparentOriginLevel:
      combinationConfig.baseTransparentOriginLevel ??
      DEFAULT_COLOR_CONFIG.transparentOriginLevel,
    enableChromaAdjustment: DEFAULT_COLOR_CONFIG.enableChromaAdjustment,
  };
};

/**
 * Generate secondary palettes
 */
const generateSecondaryConfigss = ({
  primaryOklch,
  primaryOriginLevel,
  combinationType,
  combinationConfig,
}: {
  primaryOklch: Oklch;
  primaryOriginLevel: number;
  combinationType: CombinationType;
  combinationConfig: CombinationConfig;
}): ColorConfig[] => {
  if (combinationType === "monochromatic") {
    return [];
  }

  // Get hue shift values for each secondary color
  const secondaryHues = getSecondaryHues({
    primaryOklch,
    combinationType,
  });

  const results = [];

  const secondaryColorMap = [
    {
      id: "secondary",
      prefix: "secondary",
      hue: secondaryHues.secondary,
    },
    {
      id: "secondary2",
      prefix: "secondary2",
      hue: secondaryHues.secondary2,
    },
    {
      id: "secondary3",
      prefix: "secondary3",
      hue: secondaryHues.secondary3,
    },
  ];

  for (const { id, prefix, hue } of secondaryColorMap) {
    if (hue !== undefined) {
      const secondaryOklch = {
        mode: "oklch" as const,
        l: primaryOklch.l,
        c: primaryOklch.c,
        h: hue,
      };

      // 3. Generate complete secondary palette using provisional base OKLCH directly
      const secondaryConfig = {
        id: id,
        prefix: prefix,
        seedColor: oklchToHexPerceptual(secondaryOklch),
        seedOklch: secondaryOklch,
        hueShiftMode:
          combinationConfig.hueShiftMode ?? DEFAULT_COLOR_CONFIG.hueShiftMode,
        enableLightnessAdjustment: false,
        combinationHueShift: hue,
        includeTransparent:
          combinationConfig.includeTransparent ??
          DEFAULT_COLOR_CONFIG.includeTransparent,
        includeTextColors:
          combinationConfig.includeTextColors ??
          DEFAULT_COLOR_CONFIG.includeTextColors,
        bgColorLight:
          combinationConfig.bgColorLight ?? DEFAULT_COLOR_CONFIG.bgColorLight,
        bgColorDark:
          combinationConfig.bgColorDark ?? DEFAULT_COLOR_CONFIG.bgColorDark,
        transparentOriginLevel:
          combinationConfig.transparentOriginLevel ??
          DEFAULT_COLOR_CONFIG.transparentOriginLevel,
        enableChromaAdjustment: DEFAULT_COLOR_CONFIG.enableChromaAdjustment,
      };

      // 4. Add secondary color config
      results.push(secondaryConfig);
    }
  }

  return results;
};

/**
 * Get hue shift values for secondary colors without generating actual colors
 */

const getSecondaryHues = ({
  primaryOklch,
  combinationType,
}: {
  primaryOklch: Oklch;
  combinationType: CombinationType;
}): {
  secondary?: number;
  secondary2?: number;
  secondary3?: number;
} => {
  const primaryHue = primaryOklch.h || 0;

  const combinationMap: Record<CombinationType, any> = {
    complementary: {
      secondary: (primaryHue + 180) % 360,
    },
    triadic: {
      secondary: (primaryHue + 120) % 360,
      secondary2: (primaryHue + 240) % 360,
    },
    tetradic: {
      secondary: (primaryHue + 90) % 360,
      secondary2: (primaryHue + 180) % 360,
      secondary3: (primaryHue + 270) % 360,
    },
    analogous: {
      secondary: (primaryHue + 30) % 360,
      secondary2: (primaryHue - 30 + 360) % 360,
    },
    splitComplementary: {
      secondary: (primaryHue + 150) % 360,
      secondary2: (primaryHue + 210) % 360,
    },
    doubleComplementary: {
      secondary: (primaryHue + 180) % 360,
      secondary2: (primaryHue + 30) % 360,
      secondary3: (primaryHue + 210) % 360,
    },
    doubleComplementaryReverse: {
      secondary: (primaryHue + 180) % 360,
      secondary2: (primaryHue - 30 + 360) % 360,
      secondary3: (primaryHue + 150) % 360,
    },
    monochromatic: {},
  };

  return combinationMap[combinationType] || {};
};

// =============================================================================
// Gamut Mapping for Combination Colors
// =============================================================================

// =============================================================================
// Color Generation
// =============================================================================

/**
 * Get base color (final color string)
 */
const getBaseColor = ({
  primaryOklch,
  strategy = "harmonic",
}: {
  primaryOklch: Oklch;
  strategy?: BaseColorStrategy;
}): Oklch => {
  const targetLightness = DEFAULT_LEVEL_500_LIGHTNESS; // Level 500 equivalent (middle lightness, 0-1 range)

  // Calculate base chroma (moderate chroma for base colors)
  const baseChroma = Math.max(
    BASE_COLOR_CHROMA_MIN,
    Math.min(
      BASE_COLOR_CHROMA_MAX,
      (primaryOklch.c || 0) * BASE_COLOR_CHROMA_MULTIPLIER
    )
  );

  const strategyMap: Record<
    BaseColorStrategy,
    { baseHue: number; finalChroma: number }
  > = {
    harmonic: { baseHue: primaryOklch.h || 0, finalChroma: baseChroma },
    contrasting: {
      baseHue: normalizeHue((primaryOklch.h || 0) + 180),
      finalChroma: baseChroma,
    },
    neutral: { baseHue: 0, finalChroma: BASE_COLOR_NEUTRAL_CHROMA },
  };

  const { baseHue, finalChroma } =
    strategyMap[strategy] || strategyMap.harmonic;

  // Create OKLCH color with target lightness
  const newOklchObj = {
    mode: "oklch" as const,
    l: targetLightness, // 0-1 range // Convert to 0-1 range
    c: finalChroma,
    h: baseHue,
  };
  return newOklchObj;
};
