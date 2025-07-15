# Color Palette Generator

A comprehensive color palette generation library with support for color scales, combinations, and transparency.

## Features

- 🎨 **Color Palette Generation**: Generate complete color palettes from a single base color
- 💧 **Transparency Support**: Generate transparent color variants
- 🎲 **Random Color Generation**: Generate random colors with customizable parameters
- 🔀 **Color Combinations**: Create harmonious color combinations (complementary, triadic, analogous, etc.)
- 🎯 **Lightness Control**: Precise control over color lightness and contrast
- 🔧 **Utility Functions**: Comprehensive color conversion utilities (HEX, RGB, HSL)

## Installation

```bash
npm install @14ch/color-palette-generator
```

## Usage

### Basic Palette Generation

```typescript
import { generateColorPalette } from "@14ch/color-palette-generator";

// Generate a color palette from a single base color
const palette = generateColorPalette({
  id: "primary",
  prefix: "primary",
  color: "#3b82f6",
  lightnessMethod: "hybrid",
  hueShiftMode: "natural",
  includeTransparent: true,
});

console.log(palette);
// Output: {
//   '--primary-50': '#eff6ff',
//   '--primary-100': '#dbeafe',
//   ...,
//   '--primary-950': '#1e3a8a',
//   '--primary-500-transparent': 'rgba(59, 130, 246, 1)'
// }

// Generate palettes from multiple colors
const configs = [
  { id: "primary", prefix: "primary", color: "#3b82f6" },
  { id: "secondary", prefix: "secondary", color: "#10b981" },
];
const multiPalette = generateColorPalette(configs);
```

### Transparency Support

```typescript
import { generateColorPalette } from "@14ch/color-palette-generator";

// Generate palette with transparent variants
const paletteWithTransparency = generateColorPalette({
  id: "primary",
  prefix: "primary",
  color: "#3b82f6",
  includeTransparent: true,
  bgColorLight: "#ffffff", // Background for light mode
  bgColorDark: "#000000", // Background for dark mode
  transparentOriginLevel: 500, // Base level for transparency calculation
});

console.log(paletteWithTransparency);
// Output includes:
// '--primary-500-transparent': 'rgba(59, 130, 246, 1)',
// '--primary-400-transparent': 'rgba(96, 165, 250, 1)',
// etc.
```

### Random Color Generation

```typescript
import { generateRandomPrimaryColor } from "@14ch/color-palette-generator";

// Generate a random color with constraints
const randomColor = generateRandomPrimaryColor({
  saturationRange: [70, 100],
  lightnessRange: [40, 60],
  hueRange: [0, 360],
  lightnessMethod: "hybrid",
});

console.log(randomColor);
// Output: '#a855f7' (HEX string)

// Generate random color around specific hue (e.g., blue ±30°)
const colorAroundBlue = generateRandomPrimaryColor({
  hueRange: [210, 270], // Blue (240°) ±30°
  saturationRange: [70, 100],
  lightnessRange: [40, 60],
});
console.log(colorAroundBlue);
// Output: '#5d7af7' (HEX string within blue range)
```

### Color Combinations

```typescript
import { generateCombination } from "@14ch/color-palette-generator";

// Generate complementary colors
const combination = generateCombination({
  primaryColor: "#3b82f6",
  combinationType: "complementary",
  lightnessMethod: "hybrid",
  baseColorStrategy: "harmonic",
});

console.log(combination);
// Output: Array of ColorConfig objects for base, primary, and secondary colors

// Available combination types:
// "monochromatic", "analogous", "complementary", "splitComplementary",
// "doubleComplementary", "doubleComplementaryReverse", "triadic", "tetradic"
```

### Lightness Control

```typescript
import { getLightness, adjustToLightness } from "@14ch/color-palette-generator";

// Calculate lightness of a color
const lightness = getLightness({
  color: "#3b82f6",
  lightnessMethod: "hybrid", // "hybrid" | "hsl" | "perceptual" | "average"
});
console.log(lightness); // Output: number (0-100)

// Adjust color to target lightness
const adjustedColor = adjustToLightness({
  h: 220,
  s: 80,
  targetLightness: 70,
  lightnessMethod: "hybrid",
});
console.log(adjustedColor); // Output: '#5d8df7' (HEX string)
```

### Utility Functions

```typescript
import {
  hexToRGB,
  rgbToHSL,
  hslToRGB,
  rgbToHex,
} from "@14ch/color-palette-generator";

// Convert between color formats
const rgb = hexToRGB("#3b82f6");
const hsl = rgbToHSL(rgb);
const newRgb = hslToRGB(hsl);
const hex = rgbToHex(newRgb);

console.log({ rgb, hsl, newRgb, hex });
// Output: {
//   rgb: { r: 59, g: 130, b: 246 },
//   hsl: { h: 217, s: 91, l: 60 },
//   newRgb: { r: 59, g: 130, b: 246 },
//   hex: '#3b82f6'
// }
```

### Apply to DOM

```typescript
import { applyColorPaletteToDom } from "@14ch/color-palette-generator";

const palette = generateColorPalette({
  id: "primary",
  prefix: "primary",
  color: "#3b82f6",
});

// Apply CSS custom properties to document root
applyColorPaletteToDom(palette);
// Now you can use var(--primary-500) in your CSS

// Example CSS usage:
// .button { background-color: var(--primary-500); }
// .text { color: var(--primary-700); }
```

## API Reference

### Types

```typescript
interface ColorConfig {
  id: string;
  prefix: string;
  color: string;
  hueShiftMode?: HueShiftMode;
  lightnessMethod?: LightnessMethod;
  includeTransparent?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
}

interface Palette {
  [key: string]: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface CombinationConfig {
  primaryColor: string;
  combinationType?: CombinationType;
  lightnessMethod?: LightnessMethod;
  baseColorStrategy?: BaseColorStrategy;
}

interface RandomColorConfig {
  saturationRange?: [number, number];
  lightnessRange?: [number, number];
  lightnessMethod?: LightnessMethod;
  hueRange?: [number, number];
}

type LightnessMethod = "hybrid" | "hsl" | "perceptual" | "average";
type HueShiftMode = "fixed" | "natural" | "unnatural";
type BaseColorStrategy = "harmonic" | "contrasting" | "neutral";
type CombinationType =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "splitComplementary"
  | "doubleComplementary"
  | "doubleComplementaryReverse"
  | "triadic"
  | "tetradic";
```

### Functions

#### `generateColorPalette(config: ColorConfig): Palette`

#### `generateColorPalette(configs: ColorConfig[]): Palette`

Generates a complete color palette from a base color (or multiple colors) with CSS custom property names.

**Single configuration:**

```typescript
const palette = generateColorPalette(config);
```

**Multiple configurations:**

```typescript
const configs = [
  { id: "primary", prefix: "primary", color: "#007bff" },
  { id: "secondary", prefix: "secondary", color: "#6c757d" },
];
const palette = generateColorPalette(configs);
```

#### `generateCombination(config: CombinationConfig): ColorConfig[]`

Generates color combinations based on color theory, returning an array of ColorConfig objects.

#### `generateRandomPrimaryColor(config?: RandomColorConfig): string`

Generates a random color with optional constraints, returning a HEX string.

#### `getLightness(color: string, method?: LightnessMethod): number`

Calculates the lightness of a color using the specified method.

#### `adjustToLightness({ h, s, targetLightness, lightnessMethod? }): string`

Adjusts HSL values to achieve a target lightness, returning a HEX string.

#### `applyColorPaletteToDom(palette: Palette): void`

Applies CSS custom properties to the document root element.

#### Color Conversion Utilities

- `hexToRGB(hex: string): RGB`
- `rgbToHex(rgb: RGB): string`
- `hexToHSL(hex: string): HSL`
- `hslToRGB(hsl: HSL): RGB`
- `rgbToHSL(rgb: RGB): HSL`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
