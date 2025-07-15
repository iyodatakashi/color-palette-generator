// applyToDom.ts

import type { Palette } from "./types";

/**
 * Apply CSS custom properties to DOM
 */
export const applyColorPaletteToDom = (palette: Palette): void => {
  if (typeof document !== "undefined") {
    Object.entries(palette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }
};
