// lightness.ts

import * as culori from "culori";
import {
  adjustSaturationForLightness,
  getTheoreticalSaturationCoefficient,
  getPerceptualSaturation,
} from "./saturation";
import {
  SCALE_LEVELS,
  STANDARD_LIGHTNESS_SCALE,
  PERCEPTUAL_LIGHTNESS_SCALE,
  STANDARD_MAX_LIGHTNESS,
  STANDARD_MIN_LIGHTNESS,
  PERCEPTUAL_MAX_LIGHTNESS,
  PERCEPTUAL_MIN_LIGHTNESS,
  MAX_LEVEL,
  MIN_LEVEL,
} from "./constants";
import type { LightnessMethod, RGB } from "./types";

// =============================================================================
// Lightness Calculation Functions
// =============================================================================

/**
 * Get lightness value from color according to lightness calculation method
 */
export const getLightness = ({
  color,
  lightnessMethod = "hybrid",
}: {
  color: string;
  lightnessMethod?: LightnessMethod;
}): number => {
  // Convert color using culori
  const colorObj = culori.parse(color);
  if (!colorObj) return 0;

  const rgb = culori.converter("rgb")(colorObj);
  if (!rgb) return 0;

  switch (lightnessMethod) {
    case "hsl":
      return getHSLLightness(rgb);
    case "perceptual":
      return getPerceptualLightness(rgb);
    case "average":
      return getAverageLightness(rgb);
    case "hybrid":
    default:
      return getHybridLightness(rgb);
  }
};

/**
 * Calculate perceptual lightness from RGB (OKLCH based)
 */
const getPerceptualLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  // Convert RGB directly to OKLCH to get lightness
  // Convert RGB to OKLCH using culori
  const rgbObj = { mode: "rgb" as const, r: r / 255, g: g / 255, b: b / 255 };
  const oklch = culori.converter("oklch")(rgbObj);

  // OKLCH lightness is 0-1, convert to 0-100 scale
  return oklch.l * 100;
};

/**
 * Get HSL lightness
 */
const getHSLLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  // Convert RGB to HSL using culori
  const rgbObj = { mode: "rgb" as const, r: r / 255, g: g / 255, b: b / 255 };
  const hslColor = culori.converter("hsl")(rgbObj);
  const hsl = {
    h: hslColor.h || 0,
    s: (hslColor.s || 0) * 100,
    l: (hslColor.l || 0) * 100,
  };
  return hsl.l;
};

/**
 * Get RGB average lightness
 */
const getAverageLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const average = (r + g + b) / 3;
  return (average / 255) * 100;
};

/**
 * Get hybrid lightness (weighted average of perceptual lightness + HSL lightness)
 */
export const getHybridLightness = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number => {
  const perceptual = getPerceptualLightness({ r, g, b });
  // Convert RGB to HSL using culori
  const rgbObj = { mode: "rgb" as const, r: r / 255, g: g / 255, b: b / 255 };
  const hslColor = culori.converter("hsl")(rgbObj);
  const hsl = {
    h: hslColor.h || 0,
    s: (hslColor.s || 0) * 100,
    l: (hslColor.l || 0) * 100,
  };
  // Weighted average of perceptual lightness and HSL lightness
  return perceptual * 0.3 + hsl.l * 0.7;
};

// =============================================================================
// Lightness Adjustment Functions
// =============================================================================

/**
 * Adjust color to achieve specified lightness
 */
export const adjustToLightness = ({
  h,
  s,
  targetLightness,
  lightnessMethod = "hybrid",
  enableSaturationAdjustment = true,
  baseLightness = 50,
  baseColor,
}: {
  h: number;
  s: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
  enableSaturationAdjustment?: boolean;
  baseLightness?: number;
  baseColor?: string;
}): string => {
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  s = isFinite(s) ? Math.max(0, Math.min(100, s)) : 0;
  targetLightness = isFinite(targetLightness) ? targetLightness : 50;
  baseLightness = isFinite(baseLightness) ? baseLightness : 50;

  // Adjust saturation based on lightness change if enabled
  const adjustedSaturation = enableSaturationAdjustment
    ? adjustSaturationForLightness({
        h,
        s,
        baseLightness,
        targetLightness,
      })
    : s;

  switch (lightnessMethod) {
    case "hsl":
      return adjustToHSLLightness({
        h,
        s: adjustedSaturation,
        targetLightness,
      });
    case "perceptual":
      // For perceptual lightness, use direct perceptual lightness adjustment
      return adjustToPerceptualLightness({
        h,
        s: adjustedSaturation,
        targetLightness,
        baseColor,
      });
    case "hybrid":
      // For hybrid lightness, use direct hybrid lightness adjustment
      return adjustToHybridLightness({
        h,
        s: adjustedSaturation,
        targetLightness,
        baseColor,
      });
    default:
      return adjustToLightnessByBinarySearch({
        h,
        s: adjustedSaturation,
        targetLightness,
        lightnessMethod,
        baseLightness,
      });
  }
};

/**
 * Direct adjustment by HSL lightness (100% round-trip consistency guaranteed)
 */
export const adjustToHSLLightness = ({
  h,
  s,
  targetLightness,
}: {
  h: number;
  s: number;
  targetLightness: number;
}): string => {
  const hsl = { h, s, l: targetLightness };
  // Convert HSL to RGB using culori
  const hslObj = {
    mode: "hsl" as const,
    h: hsl.h,
    s: hsl.s / 100,
    l: hsl.l / 100,
  };
  const rgb = culori.converter("rgb")(hslObj);
  return culori.formatHex(rgb);
};

/**
 * Direct adjustment by perceptual lightness using OKLCH chroma preservation
 */
export const adjustToPerceptualLightness = ({
  h,
  s,
  targetLightness,
  baseColor,
}: {
  h: number;
  s: number;
  targetLightness: number;
  baseColor?: string;
}): string => {
  let originalOKLCH;

  if (baseColor) {
    // Use actual base color's OKLCH chroma
    const baseColorObj = culori.parse(baseColor);
    originalOKLCH = culori.converter("oklch")(baseColorObj);
  } else {
    // Fallback to HSL-based calculation
    const hslObj = { mode: "hsl" as const, h, s: s / 100, l: 0.5 };
    const originalRGB = culori.converter("rgb")(hslObj);
    originalOKLCH = culori.converter("oklch")(originalRGB);
  }

  // Create new OKLCH with target lightness and original chroma
  if (!originalOKLCH) return "#000000";

  const newOKLCH = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: originalOKLCH.c, // Preserve original chroma
    h: originalOKLCH.h, // Use original hue from base color
  };

  // Convert back to RGB
  const newRGB = culori.converter("rgb")(newOKLCH);
  return culori.formatHex(newRGB);
};

/**
 * Direct adjustment by hybrid lightness using OKLCH chroma preservation
 */
export const adjustToHybridLightness = ({
  h,
  s,
  targetLightness,
  baseColor,
}: {
  h: number;
  s: number;
  targetLightness: number;
  baseColor?: string;
}): string => {
  let originalOKLCH;

  if (baseColor) {
    // Use actual base color's OKLCH chroma
    const baseColorObj = culori.parse(baseColor);
    originalOKLCH = culori.converter("oklch")(baseColorObj);
  } else {
    // Fallback to HSL-based calculation
    const hslObj = { mode: "hsl" as const, h, s: s / 100, l: 0.5 };
    const originalRGB = culori.converter("rgb")(hslObj);
    originalOKLCH = culori.converter("oklch")(originalRGB);
  }

  // Create new OKLCH with target lightness and original chroma
  if (!originalOKLCH) return "#000000";

  const newOKLCH = {
    mode: "oklch" as const,
    l: targetLightness / 100, // Convert to 0-1 range
    c: originalOKLCH.c, // Preserve original chroma
    h: originalOKLCH.h, // Use original hue from base color
  };

  // Convert back to RGB
  const newRGB = culori.converter("rgb")(newOKLCH);
  return culori.formatHex(newRGB);
};

/**
 * Lightness adjustment with OKLCH chroma preservation using theoretical curve
 */
const adjustToLightnessByBinarySearch = ({
  h,
  s,
  targetLightness,
  lightnessMethod = "hybrid",
  baseLightness = 50,
}: {
  h: number;
  s: number;
  targetLightness: number;
  lightnessMethod?: LightnessMethod;
  baseLightness?: number;
}): string => {
  // Step 1: Generate color with specified lightness method
  const initialColor = adjustToHSLLightness({
    h,
    s,
    targetLightness,
  });

  // Step 2: Use base color chroma directly (without theoretical curve)
  const hslObj = {
    mode: "hsl" as const,
    h,
    s: s / 100,
    l: baseLightness / 100,
  };
  const baseRgb = culori.converter("rgb")(hslObj);
  const baseOKLCH = culori.converter("oklch")(baseRgb);
  const targetChroma = baseOKLCH.c; // Use base color chroma directly

  // Get current OKLCH values
  const currentColorObj = culori.parse(initialColor);
  if (!currentColorObj) return initialColor;

  const currentRGB = culori.converter("rgb")(currentColorObj);
  if (!currentRGB) return initialColor;

  const currentOKLCH = culori.converter("oklch")(currentColorObj);
  if (!currentOKLCH) return initialColor;

  // If chroma is already close to target, return initial color
  if (Math.abs(currentOKLCH.c - targetChroma) < 0.001) {
    return initialColor;
  }

  // Step 3: Adjust HSL saturation to match target chroma
  const adjustedColor = adjustHSLForOKLCHChroma({
    h,
    s,
    l: targetLightness,
    targetChroma,
    lightnessMethod,
    targetLightness,
  });

  return adjustedColor;
};

/**
 * Adjust HSL saturation to match target OKLCH chroma
 */
const adjustHSLForOKLCHChroma = ({
  h,
  s,
  l,
  targetChroma,
  lightnessMethod,
  targetLightness,
}: {
  h: number;
  s: number;
  l: number;
  targetChroma: number;
  lightnessMethod: LightnessMethod;
  targetLightness: number;
}): string => {
  const MAX_ITERATIONS = 50;
  const PRECISION_THRESHOLD = 0.001;

  let low = 0;
  let high = 100;
  let bestS = s;
  let bestDiff = Infinity;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const hslObj = { mode: "hsl" as const, h, s: mid / 100, l: l / 100 };
    const rgb = culori.converter("rgb")(hslObj);
    const currentOKLCH = culori.converter("oklch")(rgb);
    const chromaDiff = Math.abs(currentOKLCH.c - targetChroma);

    // Record S value with best chroma match
    if (chromaDiff < bestDiff) {
      bestDiff = chromaDiff;
      bestS = mid;
    }

    // Exit if sufficient precision is reached
    if (chromaDiff < PRECISION_THRESHOLD) break;

    // Exit if range becomes sufficiently small
    if (high - low < PRECISION_THRESHOLD) break;

    if (currentOKLCH.c < targetChroma) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Step 4: Adjust lightness if it deviated from target
  const finalHslObj = { mode: "hsl" as const, h, s: bestS / 100, l: l / 100 };
  const finalRGB = culori.converter("rgb")(finalHslObj);
  const finalLightness = getLightness({
    color: culori.formatHex(finalRGB),
    lightnessMethod,
  });
  const lightnessDiff = Math.abs(finalLightness - targetLightness);

  // If lightness deviated significantly, adjust it
  if (lightnessDiff > 0.01) {
    return adjustToHSLLightness({
      h,
      s: bestS,
      targetLightness,
    });
  }

  return culori.formatHex(finalRGB);
};

// =============================================================================
// Scale Generation Functions
// =============================================================================

/**
 * Find the closest lightness level to the specified color
 */
export const findClosestLevel = ({
  inputLightness,
  lightnessMethod = "hybrid",
}: {
  inputLightness: number;
  lightnessMethod?: LightnessMethod;
}): number => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  return SCALE_LEVELS.reduce((closestLevel, current) => {
    const lightness =
      lightnessMethod !== "perceptual"
        ? getAdjustedLightness({ level: current, lightnessMethod })
        : lightnessMethod === "perceptual"
        ? PERCEPTUAL_LIGHTNESS_SCALE[current]
        : STANDARD_LIGHTNESS_SCALE[current];

    const currentDiff = Math.abs(inputLightness - lightness);
    const closestDiff = Math.abs(
      inputLightness -
        (lightnessMethod !== "perceptual"
          ? getAdjustedLightness({ level: closestLevel, lightnessMethod })
          : lightnessMethod === "perceptual"
          ? PERCEPTUAL_LIGHTNESS_SCALE[closestLevel]
          : STANDARD_LIGHTNESS_SCALE[closestLevel])
    );

    return currentDiff < closestDiff ? current : closestLevel;
  });
};

/**
 * Calculate even scale based on the specified color
 */
export const calculateEvenScale = ({
  inputLightness,
  baseLevel,
  lightnessMethod = "hybrid",
}: {
  inputLightness: number;
  baseLevel: number;
  lightnessMethod?: LightnessMethod;
}): Record<number, number> => {
  if (!isFinite(inputLightness)) inputLightness = 50;

  // Use appropriate scale and limits based on lightness method
  const scale =
    lightnessMethod === "perceptual"
      ? PERCEPTUAL_LIGHTNESS_SCALE
      : STANDARD_LIGHTNESS_SCALE;

  const maxLightness =
    lightnessMethod === "perceptual"
      ? PERCEPTUAL_MAX_LIGHTNESS
      : STANDARD_MAX_LIGHTNESS;
  const minLightness =
    lightnessMethod === "perceptual"
      ? PERCEPTUAL_MIN_LIGHTNESS
      : STANDARD_MIN_LIGHTNESS;

  const clampedInputLightness = Math.max(
    minLightness,
    Math.min(maxLightness, inputLightness)
  );

  if (!SCALE_LEVELS.includes(baseLevel)) baseLevel = 500;

  const STEP_SIZE = 50;
  const baseIndex = (baseLevel - MIN_LEVEL) / STEP_SIZE;
  const totalSteps = (MAX_LEVEL - MIN_LEVEL) / STEP_SIZE;

  const upwardSteps = baseIndex;
  const downwardSteps = totalSteps - baseIndex;

  const availableUpward = maxLightness - clampedInputLightness;
  const availableDownward = clampedInputLightness - minLightness;

  const upwardInterval = upwardSteps > 0 ? availableUpward / upwardSteps : 0;
  const downwardInterval =
    downwardSteps > 0 ? availableDownward / downwardSteps : 0;

  const evenScale: Record<number, number> = {};

  // For perceptual lightness, use PERCEPTUAL_LIGHTNESS_SCALE directly
  if (lightnessMethod === "perceptual") {
    SCALE_LEVELS.forEach((level) => {
      evenScale[level] = scale[level];
    });
    return evenScale;
  }

  // For other methods, use the original logic
  evenScale[baseLevel] = clampedInputLightness;

  // Upper levels (bright direction)
  for (let i = 1; i <= upwardSteps; i++) {
    const level = baseLevel - i * STEP_SIZE;
    const lightness = Math.min(
      clampedInputLightness + upwardInterval * i,
      maxLightness
    );
    evenScale[level] = lightness;
  }

  // Lower levels (dark direction)
  for (let i = 1; i <= downwardSteps; i++) {
    const level = baseLevel + i * STEP_SIZE;
    const lightness = Math.max(
      clampedInputLightness - downwardInterval * i,
      minLightness
    );
    evenScale[level] = lightness;
  }

  // Return clamped results
  const adjustedLightnessScale: Record<number, number> = {};
  SCALE_LEVELS.forEach((level) => {
    if (evenScale[level] !== undefined) {
      adjustedLightnessScale[level] = Math.max(
        minLightness,
        Math.min(maxLightness, evenScale[level])
      );
    }
  });

  return adjustedLightnessScale;
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get adjusted lightness according to method
 */
const getAdjustedLightness = ({
  level,
  lightnessMethod,
}: {
  level: number;
  lightnessMethod: LightnessMethod;
}): number => {
  const normalizedLevel = (level - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);

  switch (lightnessMethod) {
    case "hsl":
    case "average":
      return (
        STANDARD_MAX_LIGHTNESS -
        normalizedLevel * (STANDARD_MAX_LIGHTNESS - STANDARD_MIN_LIGHTNESS)
      );
    case "hybrid":
      return STANDARD_LIGHTNESS_SCALE[level];
    case "perceptual":
      return PERCEPTUAL_LIGHTNESS_SCALE[level];
    default:
      return STANDARD_LIGHTNESS_SCALE[level];
  }
};
