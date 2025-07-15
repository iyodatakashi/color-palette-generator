// constants.ts

import type { HueShiftMode, LightnessMethod, RandomColorConfig } from './types';

/**
 * レベルの定義
 */
export const SCALE_LEVELS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
export const MIN_LEVEL = 50;
export const MAX_LEVEL = 950;

/**
 * 明度階調の定義
 */
export const STANDARD_LIGHTNESS_SCALE: Record<number, number> = {
	50: 96,
	100: 92,
	200: 83,
	300: 74,
	400: 65,
	500: 56,
	600: 47,
	700: 38,
	800: 29,
	900: 20,
	950: 16
};

export const MAX_LIGHTNESS = 96;
export const MIN_LIGHTNESS = 16;

/**
 * アルファ値の定義
 */
export const MIN_ALPHA = 0.1;
export const MAX_ALPHA = 1.0;

/**
 * デフォルト設定
 */
export const DEFAULT_LIGHTNESS_METHOD = 'hybrid' as const;

export const DEFAULT_HUE_SHIFT_MODE = 'natural' as const;

export const DEFAULT_COLOR_CONFIG = {
	lightnessMethod: 'hybrid' as LightnessMethod,
	hueShiftMode: 'natural' as HueShiftMode,
	includeTransparent: true,
	bgColorLight: '#ffffff',
	bgColorDark: '#000000',
	transparentOriginLevel: 500
};

export const DEFAULT_BASE_COLOR_CONFIG = {
	lightnessMethod: 'hybrid' as LightnessMethod,
	hueShiftMode: 'fixed' as HueShiftMode,
	includeTransparent: true,
	bgColorLight: '#ffffff',
	bgColorDark: '#000000',
	transparentOriginLevel: 950
};

/**
 * デフォルトオプション
 */
export const DEFAULT_RANDOM_COLOR_CONFIG: Required<RandomColorConfig> = {
	saturationRange: [35, 75], // 適度な彩度
	lightnessRange: [STANDARD_LIGHTNESS_SCALE[300], STANDARD_LIGHTNESS_SCALE[700]], // 指定された明度
	lightnessMethod: 'hybrid', // バランス明度
	hueRange: [0, 360] // 全色相
};
