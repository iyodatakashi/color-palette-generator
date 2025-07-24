// hue.ts

import {
  hexToHSL,
  hslToRGB,
  rgbToHex,
  hslToHex,
  validateHexColor,
} from "./colorUtils";
import { getLightness, adjustToLightness } from "./lightness";
import type { LightnessMethod } from "./types";

// =============================================================================
// Hue Change Functions
// =============================================================================

/**
 * Change color hue while maintaining the same tone (lightness and saturation)
 */
export const changeHueWithSameTone = ({
  color,
  targetHue,
  lightnessMethod = "hybrid",
}: {
  color: string;
  targetHue: number;
  lightnessMethod?: LightnessMethod;
}): string => {
  // Normalize target hue to 0-360 range
  targetHue = isFinite(targetHue) ? ((targetHue % 360) + 360) % 360 : 0;

  // Check if the color is valid
  if (!validateHexColor(color)) {
    // Fallback for invalid color
    return color;
  }

  // Convert input color to HSL
  const hsl = hexToHSL(color);

  // Calculate perceived lightness of original color using specified method
  const originalPerceivedLightness = getLightness({
    color: color,
    lightnessMethod,
  });

  // Use existing adjustToLightness function to maintain perceived lightness
  return adjustToLightness({
    h: targetHue,
    s: hsl.s,
    targetLightness: originalPerceivedLightness,
    lightnessMethod,
  });
};
