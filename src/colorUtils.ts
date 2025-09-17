// colorUtils.ts

import type { RGB, HSL } from "./types";
import { createContextLogger } from "./logger";

// Type definition for OKLAB color space
type OKLAB = {
  l: number; // Lightness (0-1)
  a: number; // Green-Red axis (-0.4 to 0.4)
  b: number; // Blue-Yellow axis (-0.4 to 0.4)
};

const log = createContextLogger("ColorUtils");

// =============================================================================
// Validate HEX Color
// =============================================================================

export const validateHexColor = (color: string): boolean => {
  try {
    const cleanColor = String(color).trim();
    if (!cleanColor || cleanColor.length === 0) {
      return false;
    }

    const normalizedColor = cleanColor.startsWith("#")
      ? cleanColor
      : `#${cleanColor}`;

    if (normalizedColor.length !== 7) {
      return false;
    }

    // Check basic hex format
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    if (!hexPattern.test(normalizedColor)) {
      return false;
    }

    // Parse RGB values directly
    const r = parseInt(normalizedColor.slice(1, 3), 16);
    const g = parseInt(normalizedColor.slice(3, 5), 16);
    const b = parseInt(normalizedColor.slice(5, 7), 16);

    // Validate each component is within valid range
    if (
      isNaN(r) ||
      !isFinite(r) ||
      r < 0 ||
      r > 255 ||
      isNaN(g) ||
      !isFinite(g) ||
      g < 0 ||
      g > 255 ||
      isNaN(b) ||
      !isFinite(b) ||
      b < 0 ||
      b > 255
    ) {
      return false;
    }

    // Validate the color can be correctly represented in hex
    const convertedBack = `#${[r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")}`;

    return convertedBack.toLowerCase() === normalizedColor.toLowerCase();
  } catch (error) {
    return false;
  }
};

// =============================================================================
// RGB ⇔ HEX Conversion
// =============================================================================

export const rgbToHex = ({ r, g, b }: RGB): string => {
  const clamp = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.max(0, Math.min(255, Math.round(value)));
  };

  const clampedR = clamp(r);
  const clampedG = clamp(g);
  const clampedB = clamp(b);

  return `#${[clampedR, clampedG, clampedB]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
};

export const hexToRGB = (hex: string): RGB => {
  const cleanHex = String(hex).trim();
  const normalizedHex = cleanHex.startsWith("#") ? cleanHex : `#${cleanHex}`;

  // Simple validation without using validateHexColor
  if (normalizedHex.length !== 7 || !/^#[0-9a-fA-F]{6}$/.test(normalizedHex)) {
    log.warn("Invalid hex color detected, using black fallback", { hex });
    return { r: 0, g: 0, b: 0 };
  }

  const r = parseInt(normalizedHex.slice(1, 3), 16);
  const g = parseInt(normalizedHex.slice(3, 5), 16);
  const b = parseInt(normalizedHex.slice(5, 7), 16);

  return { r, g, b };
};

// =============================================================================
// RGBA Conversion
// =============================================================================

export const rgbaToHex = (rgba: string): string => {
  try {
    const match = rgba.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
    );
    if (!match) {
      log.warn("Invalid rgba format, returning original", { rgba });
      return rgba;
    }

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return rgbToHex({ r, g, b });
  } catch (error) {
    log.warn("Error parsing rgba color, returning original", { rgba, error });
    return rgba;
  }
};

export const hexToRGBA = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRGB(hex);

  let clampedAlpha = alpha;
  if (isNaN(alpha) || !isFinite(alpha)) {
    clampedAlpha = 1;
  }
  clampedAlpha = Math.max(0, Math.min(1, clampedAlpha));

  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha.toFixed(3)})`;
};

// =============================================================================
// RGB ⇔ HSL Conversion
// =============================================================================

export const rgbToHSL = ({ r, g, b }: RGB): HSL => {
  const clamp = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.max(0, Math.min(255, value));
  };

  r = clamp(r) / 255;
  g = clamp(g) / 255;
  b = clamp(b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToRGB = ({ h, s, l }: HSL): RGB => {
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  s = isFinite(s) ? Math.max(0, Math.min(100, s)) / 100 : 0;
  l = isFinite(l) ? Math.max(0, Math.min(100, l)) / 100 : 0;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

// =============================================================================
// HEX ⇔ HSL Conversion
// =============================================================================

export const hexToHSL = (hex: string): HSL => {
  const rgb = hexToRGB(hex);
  return rgbToHSL(rgb);
};

export const hslToHex = ({ h, s, l }: HSL): string => {
  const rgb = hslToRGB({ h, s, l });
  return rgbToHex(rgb);
};

// =============================================================================
// OKLAB Color Space Functions
// =============================================================================

/**
 * Convert RGB to OKLAB color space
 * Based on the OKLAB specification: https://bottosson.github.io/posts/oklab/
 */
export const rgbToOKLAB = ({ r, g, b }: RGB): OKLAB => {
  // First convert RGB to linear RGB
  const toLinear = (c: number): number => {
    const normalized = Math.max(0, Math.min(255, c)) / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Convert linear RGB to OKLAB
  const l =
    0.4122214708 * rLinear + 0.5363325363 * gLinear + 0.0514459929 * bLinear;
  const m =
    0.2119034982 * rLinear + 0.6806995451 * gLinear + 0.1073969566 * bLinear;
  const s =
    0.0883024619 * rLinear + 0.2817188376 * gLinear + 0.6299787005 * bLinear;

  // Apply cube root
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
};

/**
 * Convert OKLAB to RGB color space
 */
export const oklabToRGB = ({ l, a, b }: OKLAB): RGB => {
  // Convert OKLAB to linear RGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  // Apply cube
  const lLinear = l_ * l_ * l_;
  const mLinear = m_ * m_ * m_;
  const sLinear = s_ * s_ * s_;

  // Convert to RGB
  const rLinear =
    +4.0767416621 * lLinear - 3.3077115913 * mLinear + 0.2309699292 * sLinear;
  const gLinear =
    -1.2684380046 * lLinear + 2.6097574011 * mLinear - 0.3413193965 * sLinear;
  const bLinear =
    -0.0041960863 * lLinear - 0.7034186147 * mLinear + 1.707614701 * sLinear;

  // Convert linear RGB to sRGB
  const toSRGB = (c: number): number => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(toSRGB(rLinear) * 255),
    g: Math.round(toSRGB(gLinear) * 255),
    b: Math.round(toSRGB(bLinear) * 255),
  };
};

/**
 * Convert HEX to OKLAB color space
 */
export const hexToOKLAB = (hex: string): OKLAB => {
  const rgb = hexToRGB(hex);
  return rgbToOKLAB(rgb);
};

/**
 * Calculate perceptual chroma (saturation) using OKLAB
 * C = √(a² + b²)
 */
export const getPerceptualChroma = ({
  a,
  b,
}: {
  a: number;
  b: number;
}): number => {
  return Math.sqrt(a * a + b * b);
};
