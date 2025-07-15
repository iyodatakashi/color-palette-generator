// colorUtils.ts

import type { RGB, HSL } from "./types";
import { createContextLogger } from "./logger";

const log = createContextLogger("ColorUtils");

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
  try {
    const cleanHex = String(hex).trim();
    if (!cleanHex || cleanHex.length === 0) {
      return { r: 0, g: 0, b: 0 };
    }

    const normalizedHex = cleanHex.startsWith("#") ? cleanHex : `#${cleanHex}`;

    if (normalizedHex.length !== 7) {
      return { r: 0, g: 0, b: 0 };
    }

    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    if (!hexPattern.test(normalizedHex)) {
      return { r: 0, g: 0, b: 0 };
    }

    const r = parseInt(normalizedHex.slice(1, 3), 16);
    const g = parseInt(normalizedHex.slice(3, 5), 16);
    const b = parseInt(normalizedHex.slice(5, 7), 16);

    // NaN check
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      log.warn("Invalid hex color values detected, using black fallback", {
        hex,
        r,
        g,
        b,
      });
      return { r: 0, g: 0, b: 0 };
    }

    return { r, g, b };
  } catch (error) {
    log.warn("Error parsing hex color, using black fallback", { hex, error });
    return { r: 0, g: 0, b: 0 };
  }
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
