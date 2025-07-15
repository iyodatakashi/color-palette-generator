# Color Palette Library

A comprehensive color palette generation library with support for color scales, combinations, and transparency.

## Features

- 🎨 **Color Palette Generation**: Generate complete color palettes from a single base color
- 🔀 **Color Combinations**: Create harmonious color combinations (complementary, triadic, analogous, etc.)
- 🌈 **Hue Shifting**: Advanced hue shifting algorithms for dynamic color variations
- 💧 **Transparency Support**: Generate transparent color variants
- 🎯 **Lightness Control**: Precise control over color lightness and contrast
- 🎲 **Random Color Generation**: Generate random colors with customizable parameters
- 🔧 **Utility Functions**: Comprehensive color conversion utilities (HEX, RGB, HSL)

## Installation

```bash
npm install @your-username/color-palette-lib
```

## Usage

### Basic Palette Generation

```typescript
import { generateColorPalette } from '@your-username/color-palette-lib';

// Generate a color palette from a base color
const palette = generateColorPalette({
	baseColor: '#3b82f6',
	lightnessMethod: 'oklch',
	hueShiftMode: 'disabled'
});

console.log(palette);
// Output: { '50': '#eff6ff', '100': '#dbeafe', ..., '950': '#1e3a8a' }
```

### Color Combinations

```typescript
import { generateCombination } from '@your-username/color-palette-lib';

// Generate complementary colors
const combination = generateCombination({
	baseColor: '#3b82f6',
	type: 'complementary',
	strategy: 'hue'
});

console.log(combination);
// Output: { primary: '#3b82f6', secondary: '#f6823b' }
```

### Random Color Generation

```typescript
import { generateRandomPrimaryColor } from '@your-username/color-palette-lib';

// Generate a random color
const randomColor = generateRandomPrimaryColor({
	hue: { min: 0, max: 360 },
	saturation: { min: 70, max: 100 },
	lightness: { min: 40, max: 60 }
});

console.log(randomColor);
// Output: { hex: '#a855f7', hsl: { h: 283, s: 89, l: 65 } }
```

### Transparency

```typescript
import { setTransparentPalette } from '@your-username/color-palette-lib';

// Create transparent variants
const transparentPalette = setTransparentPalette({ '500': '#3b82f6' }, { baseColor: '#3b82f6' });

console.log(transparentPalette);
// Output: { '500': 'rgba(59, 130, 246, 1)' }
```

### Color Utilities

```typescript
import { hexToRGB, rgbToHSL, hslToRGB, rgbToHex } from '@your-username/color-palette-lib';

// Convert between color formats
const rgb = hexToRGB('#3b82f6');
const hsl = rgbToHSL(rgb);
const newRgb = hslToRGB(hsl);
const hex = rgbToHex(newRgb);

console.log({ rgb, hsl, newRgb, hex });
```

## API Reference

### Types

```typescript
interface ColorConfig {
	baseColor: string;
	lightnessMethod?: LightnessMethod;
	hueShiftMode?: HueShiftMode;
}

interface Palette {
	[key: string]: string;
}

type LightnessMethod = 'oklch' | 'hsl' | 'lab';
type HueShiftMode = 'disabled' | 'slight' | 'moderate' | 'strong';
type CombinationType =
	| 'complementary'
	| 'triadic'
	| 'analogous'
	| 'splitComplementary'
	| 'tetradic';
```

### Functions

#### `generateColorPalette(config: ColorConfig): Palette`

Generates a complete color palette from a base color.

#### `generateMultipleColorPalette(configs: ColorConfig[]): Palette[]`

Generates multiple color palettes from an array of configurations.

#### `generateCombination(config: CombinationConfig): Combination`

Generates color combinations based on color theory.

#### `generateRandomPrimaryColor(config?: RandomColorConfig): GeneratedColor`

Generates a random color with optional constraints.

#### `getLightness(color: string, method?: LightnessMethod): number`

Calculates the lightness of a color.

#### `adjustToLightness(color: string, targetLightness: number, method?: LightnessMethod): string`

Adjusts a color to a target lightness.

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
