// index.ts

// =============================================================================
// カラーパレット生成ライブラリ - Main Entry Point
// =============================================================================

// パレット生成機能
export { generateColorPalette, generateMultipleColorPalette } from './palette';

// カラーコンビネーション機能
export { generateCombination } from './combination';

// ランダムカラー生成機能
export { generateRandomPrimaryColor, generateRandomColorAroundHue } from './randomColor';

// 明度計算機能
export { getLightness, adjustToLightness } from './lightness';

// 基本的なカラーユーティリティ
export { hexToRGB, rgbToHex, hexToHSL, hslToRGB, rgbToHSL } from './colorUtils';

// 色相シフト機能
export { calculateHueShift } from './hueShift';

// 透過色機能
export { setTransparentPalette } from './transparentColor';

// DOMに反映
export { applyColorPaletteToDom } from './applyToDom';

// 定数
export {
	SCALE_LEVELS,
	STANDARD_LIGHTNESS_SCALE,
	DEFAULT_LIGHTNESS_METHOD,
	DEFAULT_HUE_SHIFT_MODE,
	MIN_LEVEL,
	MAX_LEVEL,
	MIN_LIGHTNESS,
	MAX_LIGHTNESS
} from './constants';

// 型定義
export type {
	Palette,
	ColorConfig,
	RGB,
	HSL,
	LightnessMethod,
	HueShiftMode,
	CombinationType,
	BaseColorStrategy,
	Combination,
	CombinationConfig,
	RandomColorConfig,
	GeneratedColor
} from './types';
