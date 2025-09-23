// combination.ts

import * as culori from "culori";
import { normalizeHue } from "./hueShift";
import { fitOklchToRgb } from "./colorUtils";
import { findClosestLevel, getLightness } from "./lightness";
import type {
  ColorConfig,
  CombinationType,
  BaseColorStrategy,
  CombinationConfig,
  CombinationResult,
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
  config: CombinationConfig
): CombinationResult => {
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
  // Remove old function call

  // Generate base and primary palettes first
  const baseConfig = {
    ...baseColorConfig,
    palette: generateColorPalette(baseColorConfig),
  };

  const primaryConfig = {
    ...primaryColorConfig,
    palette: generateColorPalette(primaryColorConfig),
  };

  // Find primary base level using findClosestLevel
  const primaryBaseLevel = findClosestLevel({
    inputLightness: getLightness(config.primaryColor),
    inputChroma: primaryOKLCH.c,
    inputHue: primaryOKLCH.h,
  });

  // Generate secondary palettes by hue-shifting primary palette levels
  const secondaryConfigs = generateSecondaryPalettesFromPrimary({
    primaryPalette: primaryConfig.palette,
    primaryOKLCH,
    primaryBaseLevel,
    combinationType,
    config,
  });

  return [baseConfig, primaryConfig, ...secondaryConfigs] as CombinationResult;
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
 * Get hue shift values for secondary colors without generating actual colors
 */
const getSecondaryHueShifts = ({
  primaryOKLCH,
  combinationType,
}: {
  primaryOKLCH: Oklch;
  combinationType: CombinationType;
}): {
  secondary?: number;
  secondary2?: number;
  secondary3?: number;
} => {
  const primaryHue = primaryOKLCH.h || 0;

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
 * Generate secondary palettes by hue-shifting primary palette levels
 */
const generateSecondaryPalettesFromPrimary = ({
  primaryPalette,
  primaryOKLCH,
  primaryBaseLevel,
  combinationType,
  config,
}: {
  primaryPalette: Record<string, string>;
  primaryOKLCH: Oklch;
  primaryBaseLevel: number;
  combinationType: CombinationType;
  config: CombinationConfig;
}) => {
  if (combinationType === "monochromatic") {
    return [];
  }

  // Get hue shift values for each secondary color
  const hueShifts = getSecondaryHueShifts({
    primaryOKLCH,
    combinationType,
  });

  const results = [];

  const secondaryColorMap = [
    { id: "secondary", prefix: "secondary", hueShift: hueShifts.secondary },
    { id: "secondary2", prefix: "secondary2", hueShift: hueShifts.secondary2 },
    { id: "secondary3", prefix: "secondary3", hueShift: hueShifts.secondary3 },
  ];

  for (const { id, prefix, hueShift } of secondaryColorMap) {
    if (hueShift !== undefined) {
      // NEW APPROACH: Generate coherent secondary scale from peak chroma color

      // 1. Find primary peak chroma level and color for scale generation
      const primaryPeak = findPrimaryPeakChromaLevel(primaryPalette);

      // 2. Generate secondary provisional base color from primary peak chroma
      const secondaryProvisionalBaseOklch = generateSecondaryBaseOklch(
        primaryPeak.color,
        hueShift
      );

      // 3. Generate complete secondary palette using provisional base OKLCH directly
      const secondaryConfig = {
        id: id,
        prefix: prefix,
        color: secondaryProvisionalBaseOklch, // Use OKLCH object directly
        hueShiftMode: "natural" as const,
        enableLightnessAdjustment: false, // セカンダリではK値調整を無効化
        combinationHueShift: hueShift, // セカンダリの色相を固定
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
      };

      // 4. Generate secondary palette using provisional base color
      const secondaryPalette = generateColorPalette(secondaryConfig);

      // 5. Set formal base color from the generated scale (same level as primary)
      const secondaryFormalBaseColor =
        (secondaryPalette as any)[`--${prefix}-${primaryBaseLevel}`] ||
        "#000000";

      results.push({
        id,
        prefix,
        color: secondaryFormalBaseColor,
        palette: secondaryPalette,
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
const generateSecondaryBaseOklch = (
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
}): string => {
  // Validate and normalize inputs
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  c = isFinite(c) ? Math.max(0, c) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 50;

  const targetColor = {
    mode: "oklch" as const,
    l: targetLightness / 100,
    c: c,
    h: h,
  };

  // Use optimized gamut mapping for same-tone generation
  const rgb8 = fitOklchToRgb(targetColor);
  return `#${rgb8.r.toString(16).padStart(2, "0")}${rgb8.g
    .toString(16)
    .padStart(2, "0")}${rgb8.b.toString(16).padStart(2, "0")}`;
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
  const targetLightness = 61; // Level 500 equivalent (middle lightness)

  // Calculate base chroma (moderate chroma for base colors)
  const baseChroma = Math.max(
    0.02,
    Math.min(0.06, (primaryOKLCH.c || 0) * 0.08)
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

  // Get primary color OKLCH for flexible gamut mapping
  const primaryOKLCHForGamut = culori.converter("oklch")(
    culori.parse(primaryColor)
  );

  const keys = ["secondary", "secondary2", "secondary3"] as const;
  for (const key of keys) {
    const targetHue = hueValues[key];
    if (targetHue !== undefined && primaryOKLCHForGamut) {
      // Use specialized same-tone color generation
      result[key] = generateSameToneColor({
        h: targetHue,
        c: primaryOKLCHForGamut.c || 0,
        targetLightness: (primaryOKLCHForGamut.l || 0.5) * 100,
      });
    }
  }

  return result;
};

// =============================================================================
// Color Adjustment
// =============================================================================
