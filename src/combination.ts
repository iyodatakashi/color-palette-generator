// combination.ts

import * as culori from "culori";
import { normalizeHue } from "./hueShift";
import {
  oklchToHexAdjustChroma,
  oklchToHexPerceptual,
  calculateRelativeChroma,
  getMaxChromaForHue,
  oklchGamutMappingPerceptual,
} from "./colorUtils";
import { findClosestLevel, getLightness } from "./lightness";
import { DEFAULT_LEVEL_500_LIGHTNESS } from "./constants";
import type {
  ColorConfig,
  CombinationType,
  BaseColorStrategy,
  CombinationConfig,
  CombinationResults,
  CombinationResult,
  Palette,
} from "./types";
import { generateColorPalette } from "./palette";
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
): CombinationResults => {
  const combinationType = combinationConfig.combinationType || "complementary";
  // Parse and convert primary color to OKLCH
  const primaryColorObj = culori.parse(combinationConfig.primaryColor);
  if (!primaryColorObj) {
    throw new Error("Invalid primary color");
  }
  const primaryOklch = culori.converter("oklch")(primaryColorObj);
  if (!primaryOklch) {
    throw new Error("Failed to convert color to OKLCH");
  }

  const baseColorConfig = getBaseColorConfig({
    primaryOklch,
    combinationConfig,
  });
  const primaryColorConfig = getPrimaryColorConfig({
    primaryOklch,
    combinationConfig,
  });

  // Generate base and primary palettes first

  const baseResult = {
    ...baseColorConfig,
    palette: generateColorPalette(baseColorConfig),
  };

  const primaryResult = {
    ...primaryColorConfig,
    palette: generateColorPalette(primaryColorConfig),
  };

  // Find primary base level using findClosestLevel
  const primaryOriginLevel = findClosestLevel({
    inputLightness: getLightness(combinationConfig.primaryColor),
    inputChroma: primaryOklch.c,
    inputHue: primaryOklch.h,
  });

  // Generate secondary palettes
  const secondaryResults = generateSecondaryPalettes({
    primaryOklch,
    primaryOriginLevel,
    combinationType,
    combinationConfig,
  });

  return [baseResult, primaryResult, ...secondaryResults];
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
    color: oklchToHexAdjustChroma(baseColor), // あとで直す
    oklch: baseColor,
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
    color: oklchToHexAdjustChroma(primaryOklch), // あとで直す
    oklch: primaryOklch,
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

/**
 * Generate secondary palettes
 */
const generateSecondaryPalettes = ({
  primaryOklch,
  primaryOriginLevel,
  combinationType,
  combinationConfig,
}: {
  primaryOklch: Oklch;
  primaryOriginLevel: number;
  combinationType: CombinationType;
  combinationConfig: CombinationConfig;
}): CombinationResult[] => {
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
      const primaryRelativeChroma = calculateRelativeChroma(primaryOklch);
      const primaryMaxChroma = getMaxChromaForHue(primaryOklch.h ?? 0);

      const secondaryMaxChroma = getMaxChromaForHue(hue);
      const secondaryOriginChroma = secondaryMaxChroma * primaryRelativeChroma;

      console.log(
        "PrMax:",
        primaryMaxChroma,
        "ScMax:",
        secondaryMaxChroma,
        "PrRlCr:",
        primaryRelativeChroma,
        "ScCol:",
        secondaryOriginChroma
      );

      const secondaryOklch = {
        mode: "oklch" as const,
        l: primaryOklch.l,
        c: secondaryOriginChroma,
        h: hue,
      };

      /*
      const secondaryOklch = oklchGamutMappingPerceptual({
        mode: "oklch" as const,
        l: primaryOklch.l,
        c: primaryOklch.c,
        h: hue,
      });
      */

      // 3. Generate complete secondary palette using provisional base OKLCH directly
      const secondaryConfig = {
        id: id,
        prefix: prefix,
        color: oklchToHexPerceptual(secondaryOklch),
        oklch: secondaryOklch,
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

      // 4. Generate secondary palette using provisional base color
      const secondaryPalette = generateColorPalette(secondaryConfig);

      results.push({
        ...secondaryConfig,
        palette: secondaryPalette,
      });
    }
  }

  return results;
};

// =============================================================================
// Secondary Palette Generation Utilities
// =============================================================================

/**
 * Find the level with highest chroma in primary palette
 */
const findPrimaryPeakChromaLevel = (
  primaryPalette: Record<string, string>
): {
  level: number;
  color: string;
  chroma: number;
} => {
  let maxChroma = -1;
  let peakLevel = 500; // fallback
  let peakColor = "";

  Object.entries(primaryPalette).forEach(([key, color]) => {
    // Extract level from key like "--primary-500"
    const levelMatch = key.match(/--primary-(\d+)/);
    if (levelMatch) {
      const level = parseInt(levelMatch[1]);
      const oklch = culori.oklch(color);
      if (oklch && oklch.c > maxChroma) {
        maxChroma = oklch.c;
        peakLevel = level;
        peakColor = color;
      }
    }
  });

  return { level: peakLevel, color: peakColor, chroma: maxChroma };
};

/**
 * Generate secondary provisional base color from primary peak chroma color
 * Returns OKLCH object without gamut mapping to preserve chroma
 */
/*
const generateSecondaryOriginalOklch = (
  primaryPeakColor: string,
  targetHue: number
): Oklch => {
  const primaryOklch = culori.oklch(primaryPeakColor);
  if (!primaryOklch) {
    throw new Error("Failed to convert primary peak color to OKLCH");
  }

  // Create secondary color with same lightness and chroma, but different hue
  // Return OKLCH without gamut mapping to preserve maximum chroma
  return {
    mode: "oklch" as const,
    l: primaryOklch.l,
    c: primaryOklch.c,
    h: targetHue,
  };
};
*/

// =============================================================================
// Gamut Mapping for Combination Colors
// =============================================================================

/**
 * Generate color with same tone (impression) for combination and hue palette generation
 * Specialized for maintaining visual consistency across color variations
 */
export const generateSameToneColor = ({
  h,
  c,
  targetLightness,
}: {
  h: number;
  c: number;
  targetLightness: number;
}): Oklch => {
  // Validate and normalize inputs
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  c = isFinite(c) ? Math.max(0, c) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 0.5; // 50% in 0-1 range

  const targetColor = {
    mode: "oklch" as const,
    l: targetLightness, // 0-1 range
    c: c,
    h: h,
  };

  // Use optimized gamut mapping for same-tone generation
  return targetColor;
};

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
    0.02,
    Math.min(0.06, (primaryOklch.c || 0) * 0.08)
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
    neutral: { baseHue: 0, finalChroma: 0.01 },
  };

  const { baseHue, finalChroma } =
    strategyMap[strategy] || strategyMap.harmonic;

  // Create OKLCH color with target lightness
  const newOKLCHObj = {
    mode: "oklch" as const,
    l: targetLightness, // 0-1 range // Convert to 0-1 range
    c: finalChroma,
    h: baseHue,
  };
  return newOKLCHObj;
};
