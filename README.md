# Color Palette Generator

A color palette generation library that balances tones across different hues for harmonious multi-color systems.

## 🌐 Online Tool

Create color palettes with my web application at **[color-palette.14ch.jp](https://color-palette.14ch.jp)**

A full-featured color palette generator built with this library.

## Features

### Multi-hue Palette Generation with Tone Balancing

This library generates color palettes where different hues maintain similar visual weight across the same lightness levels.

When generating a palette with multiple colors (e.g., base, primary, secondary):

- Colors at the same level (e.g., 500) are adjusted to have similar perceived intensity
- By using OKLCH color space, you get a palette where different hues are consistently balanced

### Other Features

- **Color Combinations**: Generate palettes based on color theory (complementary, triadic, analogous, etc.)
- **Transparency Variants**: Generate transparent color variations
- **Random Color Generation**: Generate colors within specified ranges
- **24-Hue Swatch System**: Pre-defined color names across the color wheel
- **Configurable Adjustments**: Control lightness curves, chroma behavior, and hue shifting

## Installation

```bash
npm install @14ch/color-palette-generator
```

## Usage

### Basic Palette Generation

```typescript
import { generateColorPalette } from "@14ch/color-palette-generator";

// Generate a color palette from a single color
const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
});

console.log(palette);
// Output: {
//   '--primary-50': '#eff6ff',
//   '--primary-100': '#dbeafe',
//   ...,
//   '--primary-500': '#3b82f6',
//   ...,
//   '--primary-950': '#1e3a8a'
// }

// Generate palettes from multiple colors
const configs = [
  { prefix: "primary", seedColor: "#3b82f6" },
  { prefix: "secondary", seedColor: "#10b981" },
];
const multiPalette = generateColorPalette(configs);
```

### Color Combinations

```typescript
import {
  generateCombination,
  generateColorPalette,
} from "@14ch/color-palette-generator";

// Generate complementary colors
const colorConfigs = generateCombination({
  seedColor: "#3b82f6",
  combinationType: "complementary",
  baseColorStrategy: "harmonic",
});

// Generate palettes from the combination
const palette = generateColorPalette(colorConfigs);
```

#### Combination Types

- `monochromatic` - Single hue (base + primary only)
- `analogous` - Adjacent hues (base + primary + 2 secondaries)
- `complementary` - Opposite hues (base + primary + 1 secondary)
- `splitComplementary` - Split opposite hues (base + primary + 2 secondaries)
- `triadic` - Three evenly spaced hues (base + primary + 2 secondaries)
- `tetradic` - Four evenly spaced hues (base + primary + 3 secondaries)
- `doubleComplementary` - Two pairs of complementary hues (base + primary + 3 secondaries)
- `doubleComplementaryReverse` - Reverse of double complementary (base + primary + 3 secondaries)

#### Base Color Strategies

- `harmonic` - Base color uses same hue as primary with low chroma
- `contrasting` - Base color uses complementary hue
- `neutral` - Base color with near-zero chroma (grayscale)

```typescript
const colorConfigs = generateCombination({
  seedColor: "#3b82f6",
  combinationType: "triadic",
  baseColorStrategy: "neutral",
});
```

### Swatch Generation (24-Hue Color System)

```typescript
import {
  generateSwatch,
  generateColorPalette,
} from "@14ch/color-palette-generator";

// Generate color configs for 24 hues across the color wheel
const swatchConfigs = generateSwatch({
  seedChroma: 0.2,
  originLevel: 500,
});

// Generate palettes for all swatch colors
const swatchPalette = generateColorPalette(swatchConfigs);

// Output includes: --ruby-500, --red-500, --orange-500, --yellow-500,
// --green-500, --blue-500, --purple-500, etc.
```

### Optional Features

#### Transparent Colors

```typescript
const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
  includeTransparent: true,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
  transparentOriginLevel: 500,
});

// Output includes:
// '--primary-50-transparent': 'rgba(135, 245, 0, 0.100)',
// '--primary-500-transparent': 'rgba(137, 177, 0, 1.000)', etc.
```

#### Text Colors

```typescript
const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
  includeTextColors: true,
  bgColorLight: "#ffffff",
  bgColorDark: "#000000",
});

// Output includes:
// '--primary-text-color-on-light': 'var(--primary-700)',
// '--primary-text-color-on-dark': 'var(--primary-400)'
```

#### Variation Colors

All palettes automatically include variation colors:

```
--primary-color: var(--primary-500)
--primary-lighter: var(--primary-300)
--primary-light: var(--primary-400)
--primary-dark: var(--primary-600)
--primary-darker: var(--primary-700)
```

### Utility Functions

#### Get Color Lightness

```typescript
import { getLightness } from "@14ch/color-palette-generator";

// Get lightness value of a color (0-100)
const lightness = getLightness("#3b82f6");
console.log(lightness); // Output: 59.8
```

#### Resolve CSS Variables

```typescript
import { resolveVariable } from "@14ch/color-palette-generator";

// Palette structure: variables reference other variables
const palette = {
  "--primary-color": "var(--primary-500)", // Before: CSS variable reference
  "--primary-500": "#3b82f6", // Actual HEX value
};

const resolvedColor = resolveVariable({
  variableName: "--primary-color",
  palette,
});
// Returns: '#3b82f6'
```

#### Apply to DOM

```typescript
import {
  generateColorPalette,
  applyColorPaletteToDom,
} from "@14ch/color-palette-generator";

const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
});

applyColorPaletteToDom(palette);
// Now you can use var(--primary-500) in your CSS
```

## API Reference

### `generateColorPalette(config)`

Generate a color palette from one or more color configurations.

```typescript
import { generateColorPalette } from "@14ch/color-palette-generator";

const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
  originLevel: 500,
  hueShiftMode: "natural",
  includeTransparent: false,
  includeTextColors: false,
  enableLightnessAdjustment: true,
  enableChromaAdjustment: true,
});
```

#### Parameters

- `prefix` (string, required): CSS variable prefix
- `seedColor` (string, required): Base color in HEX format
- `originLevel` (number, required): Reference level (typically one of: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
- `id` (string, optional): Identifier for the color
- `seedOklch` (Oklch, optional): Pre-calculated OKLCH color
- `hueShiftMode` (string, optional): "fixed" | "natural" | "unnatural" (default: "natural")
- `includeTransparent` (boolean, optional): Generate transparent variants (default: false)
- `includeTextColors` (boolean, optional): Generate text colors (default: false)
- `bgColorLight` (string, optional): Background color for light mode (default: "#ffffff")
- `bgColorDark` (string, optional): Background color for dark mode (default: "#000000")
- `transparentOriginLevel` (number, optional): Reference level for transparent colors (default: 500)
- `enableLightnessAdjustment` (boolean, optional): Apply sigmoid curve for lightness (default: true)
- `enableChromaAdjustment` (boolean, optional): Apply chroma suppression at extremes (default: true)
- `enableChromaLimit` (boolean, optional): Limit maximum chroma (default: false)
- `maxChroma` (number, optional): Maximum chroma value when enableChromaLimit is true (typically 0-0.4 for sRGB gamut)

### `generateCombination(config)`

Generate harmonious color combinations based on color theory.

```typescript
import { generateCombination } from "@14ch/color-palette-generator";

const colorConfigs = generateCombination({
  seedColor: "#3b82f6",
  combinationType: "complementary",
  baseColorStrategy: "harmonic",
  enableLightnessAdjustment: true,
  enableChromaAdjustment: true,
});
```

#### Parameters

- `seedColor` (string, required): Base color in HEX format
- `combinationType` (string, optional): Combination type (default: "complementary")
- `baseColorStrategy` (string, optional): "harmonic" | "contrasting" | "neutral" (default: "harmonic")
- `enableLightnessAdjustment` (boolean, optional): Apply to primary/secondary (default: true)
- `enableChromaAdjustment` (boolean, optional): Apply to primary/secondary (default: true)
- `includeTransparent` (boolean, optional): Generate transparent variants (default: false)
- `includeTextColors` (boolean, optional): Generate text colors (default: false)
- `bgColorLight` (string, optional): Background color for light mode (default: "#ffffff")
- `bgColorDark` (string, optional): Background color for dark mode (default: "#000000")
- `transparentOriginLevel` (number, optional): Reference for primary/secondary transparent colors (default: 500)
- `baseTransparentOriginLevel` (number, optional): Reference for base transparent colors (default: 950)
- `hueShiftMode` (string, optional): "fixed" | "natural" | "unnatural" (default: "natural")
- `enableChromaLimit` (boolean, optional): Limit maximum chroma (default: true)
- `maxChroma` (number, optional): Maximum chroma value (default: 0.2, typical range: 0-0.4)

### `generateSwatch(config)`

Generate 24-hue color system configurations.

```typescript
import { generateSwatch } from "@14ch/color-palette-generator";

const swatchConfigs = generateSwatch({
  seedChroma: 0.2,
  originLevel: 500,
  enableLightnessAdjustment: true,
  enableChromaAdjustment: true,
});
```

#### Parameters

- `seedChroma` (number, required): Base chroma value for all hues (0-1)
- `originLevel` (number, optional): Reference level (default: 500)
- `enableLightnessAdjustment` (boolean, optional): Apply sigmoid curve (default: true)
- `enableChromaAdjustment` (boolean, optional): Apply chroma suppression (default: true)
- `hueShiftMode` (string, optional): "fixed" | "natural" | "unnatural" (default: "natural")
- `includeTransparent` (boolean, optional): Generate transparent variants (default: true)
- `includeTextColors` (boolean, optional): Generate text colors (default: true)
- `bgColorLight` (string, optional): Background for light mode (default: "#ffffff")
- `bgColorDark` (string, optional): Background for dark mode (default: "#000000")
- `transparentOriginLevel` (number, optional): Reference for transparent colors (default: 500)
- `enableChromaLimit` (boolean, optional): Limit maximum chroma (default: true)
- `maxChroma` (number, optional): Maximum chroma value (default: 0.2, typical range: 0-0.4)

### `generateRandomSeedColor(config)`

Generate a random color with constraints. Returns a HEX string.

```typescript
import { generateRandomSeedColor } from "@14ch/color-palette-generator";

const randomColor = generateRandomSeedColor({
  chromaRange: [0.15, 0.25],
  lightnessRange: [0.47, 0.82],
  hueRange: [0, 360],
});
// Returns: '#a855f7'
```

#### Parameters

- `chromaRange` ([number, number], optional): Chroma range (0-1) (default: [0.15, 0.25])
- `lightnessRange` ([number, number], optional): Lightness range (0-1) (default: [0.82, 0.47])
- `hueRange` ([number, number], optional): Hue range (0-360) (default: [0, 360])

### `getLightness(color)`

Get the lightness value of a color.

```typescript
import { getLightness } from "@14ch/color-palette-generator";

const lightness = getLightness("#3b82f6");
// Returns: number (0-100)
```

### `applyColorPaletteToDom(palette)`

Apply palette to DOM as CSS custom properties.

```typescript
import { applyColorPaletteToDom } from "@14ch/color-palette-generator";

applyColorPaletteToDom(palette);
// Now you can use var(--primary-500) in your CSS
```

### `resolveVariable(params)`

Resolve nested CSS variable references to final HEX values.

```typescript
import { resolveVariable } from "@14ch/color-palette-generator";

const hexValue = resolveVariable({
  variableName: "--primary-color",
  palette,
});
```

## Types

```typescript
interface ColorConfig {
  prefix: string;
  seedColor: string;
  originLevel: number;
  id?: string;
  seedOklch?: Oklch | null;
  hueShiftMode?: HueShiftMode;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  enableLightnessAdjustment?: boolean;
  enableChromaAdjustment?: boolean;
  enableChromaLimit?: boolean;
  maxChroma?: number;
}

interface CombinationConfig {
  seedColor: string;
  combinationType?: CombinationType;
  baseColorStrategy?: BaseColorStrategy;
  enableLightnessAdjustment?: boolean;
  enableChromaAdjustment?: boolean;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  baseTransparentOriginLevel?: number;
  hueShiftMode?: HueShiftMode;
  enableChromaLimit?: boolean;
  maxChroma?: number;
}

interface SwatchConfig {
  seedChroma: number;
  originLevel?: number;
  enableLightnessAdjustment?: boolean;
  enableChromaAdjustment?: boolean;
  hueShiftMode?: HueShiftMode;
  includeTransparent?: boolean;
  includeTextColors?: boolean;
  bgColorLight?: string;
  bgColorDark?: string;
  transparentOriginLevel?: number;
  enableChromaLimit?: boolean;
  maxChroma?: number;
}

interface RandomColorConfig {
  chromaRange?: [number, number];
  lightnessRange?: [number, number];
  hueRange?: [number, number];
}

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

## Advanced Configuration

### Lightness and Chroma Adjustments

Control how the library adjusts colors across different levels:

```typescript
const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
  originLevel: 500,
  enableLightnessAdjustment: true, // Apply sigmoid curve for lightness distribution
  enableChromaAdjustment: true, // Apply chroma suppression at extreme levels
});
```

- `enableLightnessAdjustment`: When true, applies a sigmoid curve to distribute lightness values naturally
- `enableChromaAdjustment`: When true, reduces chroma at very light (50) and very dark (950) levels for more natural appearance

### Hue Shift Modes

Control how hue changes across lightness levels:

```typescript
const palette = generateColorPalette({
  prefix: "primary",
  seedColor: "#3b82f6",
  originLevel: 500,
  hueShiftMode: "natural", // "fixed" | "natural" | "unnatural"
});
```

- `fixed`: Hue stays constant across all levels
- `natural`: Hue shifts naturally (warmer when lighter, cooler when darker)
- `unnatural`: Hue shifts in the opposite direction

### Chroma Limit

Limit maximum chroma in the generated palette:

```typescript
const combination = generateCombination({
  seedColor: "#ff0000",
  combinationType: "complementary",
  enableChromaLimit: true,
  maxChroma: 0.2,
});
```

## Functions Reference

#### `generateColorPalette(config: ColorConfig | ColorConfig[]): Palette`

Generate color palettes from one or more configurations.

#### `generateCombination(config: CombinationConfig): ColorConfig[]`

Generate color combinations based on color theory.

#### `generateSwatch(config: SwatchConfig): ColorConfig[]`

Generate 24-hue color system configurations.

#### `generateRandomSeedColor(config?: RandomColorConfig): string`

Generate a random color with constraints. Returns a HEX string.

#### `getLightness(color: string): number`

Get the lightness value of a color (0-100).

#### `applyColorPaletteToDom(palette: Palette): void`

Apply CSS custom properties to the document root.

#### `resolveVariable({ variableName, palette, fallback? }): string`

Resolve nested CSS variable references to final HEX values.

## License

MIT
