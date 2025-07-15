// palette.ts

import type { Palette, ColorConfig, HSL } from './types';
import { hexToRGB, rgbToHSL, rgbToHex } from './colorUtils';
import { getLightness, adjustToLightness, findClosestLevel, calculateEvenScale } from './lightness';
import { calculateHueShift } from './hueShift';
import { setTransparentPalette } from './transparentColor';
import { SCALE_LEVELS, DEFAULT_LIGHTNESS_METHOD, DEFAULT_HUE_SHIFT_MODE } from './constants';

// =============================================================================
// メイン関数
// =============================================================================

/**
 * 複数のカラーパレットを一度に生成
 */
export const generateMultipleColorPalette = (colorConfigs: ColorConfig[]): Palette => {
	const allPalette: Palette = {};

	colorConfigs.forEach((config) => {
		const palette = generateColorPalette(config);
		Object.assign(allPalette, palette);
	});

	return allPalette;
};

/**
 * 指定した色から汎用的なカラーパレットを生成
 */
export const generateColorPalette = (colorConfig: ColorConfig): Palette => {
	const inputRGB = hexToRGB(colorConfig.color);
	const normalizedColor = rgbToHex(inputRGB);
	const inputHSL = rgbToHSL(inputRGB);

	const normalizedConfig: Required<ColorConfig> = {
		...colorConfig,
		color: normalizedColor,
		lightnessMethod: colorConfig.lightnessMethod || DEFAULT_LIGHTNESS_METHOD,
		hueShiftMode: colorConfig.hueShiftMode || DEFAULT_HUE_SHIFT_MODE,
		includeTransparent: colorConfig.includeTransparent || false,
		bgColorLight: colorConfig.bgColorLight || '#ffffff',
		bgColorDark: colorConfig.bgColorDark || '#000000',
		transparentOriginLevel: colorConfig.transparentOriginLevel || 500
	};

	const inputLightness = getLightness({
		color: normalizedColor,
		lightnessMethod: normalizedConfig.lightnessMethod
	});

	const closestLevel = findClosestLevel({
		inputLightness,
		lightnessMethod: normalizedConfig.lightnessMethod
	});

	const adjustedLightnessScale = calculateEvenScale({
		inputLightness,
		baseLevel: closestLevel
	});

	const palette = generateOriginalPalette({
		colorConfig: normalizedConfig,
		inputHSL,
		closestLevel,
		adjustedLightnessScale
	});

	setVariationColors({
		colorConfig: normalizedConfig,
		closestLevel,
		palette
	});

	setTextColor({
		colorConfig: normalizedConfig,
		inputColor: normalizedColor,
		palette
	});

	if (colorConfig.includeTransparent) {
		setTransparentPalette({
			palette,
			colorConfig: normalizedConfig
		});
	}

	return palette;
};

// =============================================================================
// パレット生成ロジック
// =============================================================================

/**
 * 基本的なカラーパレットを生成
 */
const generateOriginalPalette = ({
	colorConfig,
	inputHSL,
	closestLevel,
	adjustedLightnessScale
}: {
	inputHSL: HSL;
	closestLevel: number;
	adjustedLightnessScale: Record<number, number>;
	colorConfig: Required<ColorConfig>;
}): Palette => {
	const palette: Palette = {};
	const originalLightness = adjustedLightnessScale[closestLevel];

	Object.entries(adjustedLightnessScale).forEach(([key, targetLightness]) => {
		if (parseInt(key) === closestLevel) {
			palette[`--${colorConfig.prefix}-${key}`] = colorConfig.color;
		} else {
			const adjustedHue = calculateHueShift({
				baseHue: inputHSL.h,
				baseLightness: originalLightness,
				targetLightness,
				adjustedLightnessScale,
				hueShiftMode: colorConfig.hueShiftMode
			});

			const generatedColor = adjustToLightness({
				h: adjustedHue,
				s: inputHSL.s,
				targetLightness,
				lightnessMethod: colorConfig.lightnessMethod
			});

			palette[`--${colorConfig.prefix}-${key}`] = generatedColor;
		}
	});

	return palette;
};

/**
 * Variation Colors を設定
 */
const setVariationColors = ({
	colorConfig,
	closestLevel,
	palette
}: {
	colorConfig: Required<ColorConfig>;
	closestLevel: number;
	palette: Palette;
}): void => {
	palette[`--${colorConfig.prefix}-color`] = `var(--${colorConfig.prefix}-${closestLevel})`;

	const currentIndex = SCALE_LEVELS.indexOf(closestLevel);

	const variations = [
		{ name: 'lighter', offset: -2 },
		{ name: 'light', offset: -1 },
		{ name: 'dark', offset: 1 },
		{ name: 'darker', offset: 2 }
	];

	variations.forEach(({ name, offset }) => {
		const targetIndex = Math.max(0, Math.min(SCALE_LEVELS.length - 1, currentIndex + offset));
		const targetLevel = SCALE_LEVELS[targetIndex];
		palette[`--${colorConfig.prefix}-${name}`] = `var(--${colorConfig.prefix}-${targetLevel})`;
	});
};

/**
 * Text Color を設定
 * パレット全体から明度70以下の最も番号の小さいカラーを見つけ、
 * それと入力カラーの知覚明度を比較し、より暗い方をテキストカラーとする
 * ただし、結果は必ずCSS変数参照とする
 */
const setTextColor = ({
	colorConfig,
	inputColor,
	palette
}: {
	colorConfig: Required<ColorConfig>;
	inputColor: string;
	palette: Palette;
}): void => {
	const inputRGB = hexToRGB(inputColor);
	const normalizedColor = rgbToHex(inputRGB);
	const inputPerceptualLightness = getLightness({
		color: normalizedColor,
		lightnessMethod: 'perceptual'
	});

	// パレット全体から明度70以下の最も番号の小さいカラーを取得
	let selectedLevel: number | null = null;
	let smallestLevel = Infinity;

	SCALE_LEVELS.forEach((level) => {
		const colorKey = `--${colorConfig.prefix}-${level}`;
		const levelColor = palette[colorKey];

		if (levelColor) {
			const perceptualLightness = getLightness({
				color: levelColor,
				lightnessMethod: 'perceptual'
			});

			// 明度70以下で、かつ最も番号の小さいレベルを探す
			if (perceptualLightness <= 70 && level < smallestLevel) {
				selectedLevel = level;
				smallestLevel = level;
			}
		}
	});

	// 入力カラーと見つかった暗いパレットカラーの知覚明度を比較
	if (selectedLevel !== null) {
		const selectedColor = palette[`--${colorConfig.prefix}-${selectedLevel}`];
		const selectedPerceptualLightness = getLightness({
			color: selectedColor,
			lightnessMethod: 'perceptual'
		});

		// より暗い方（知覚明度が低い方）をテキストカラーとして選択
		if (inputPerceptualLightness < selectedPerceptualLightness) {
			// 入力カラーの方が暗い場合、入力カラーと同じ色のレベルを使用
			// 入力カラーはnormalizedConfig.colorとして既にclosestLevelに配置されている
			const inputClosestLevel = findClosestLevel({
				inputLightness: inputPerceptualLightness,
				lightnessMethod: colorConfig.lightnessMethod
			});
			palette[`--${colorConfig.prefix}-text-color`] =
				`var(--${colorConfig.prefix}-${inputClosestLevel})`;
		} else {
			// パレットカラーの方が暗い場合
			palette[`--${colorConfig.prefix}-text-color`] =
				`var(--${colorConfig.prefix}-${selectedLevel})`;
		}
	} else {
		// 明度70以下のパレットカラーが見つからない場合、入力カラーのレベルを使用
		const inputClosestLevel = findClosestLevel({
			inputLightness: inputPerceptualLightness,
			lightnessMethod: colorConfig.lightnessMethod
		});
		palette[`--${colorConfig.prefix}-text-color`] =
			`var(--${colorConfig.prefix}-${inputClosestLevel})`;
	}
};
