// lightness.ts

import { hslToRGB, rgbToHex, rgbToHSL, hexToHSL, hexToRGB } from './colorUtils';
import {
	SCALE_LEVELS,
	STANDARD_LIGHTNESS_SCALE,
	MAX_LEVEL,
	MIN_LEVEL,
	MAX_LIGHTNESS,
	MIN_LIGHTNESS
} from './constants';
import type { LightnessMethod } from './types';

// =============================================================================
// 明度計算関数
// =============================================================================

/**
 * RGB から知覚的明度を計算（CIE Lab* ベース）
 */
export const getPerceptualLightness = ({
	r,
	g,
	b
}: {
	r: number;
	g: number;
	b: number;
}): number => {
	const toLinear = ({ c }: { c: number }): number => {
		if (isNaN(c) || !isFinite(c)) c = 0;
		const normalized = Math.max(0, Math.min(255, c)) / 255;
		return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
	};

	const rLinear = toLinear({ c: r });
	const gLinear = toLinear({ c: g });
	const bLinear = toLinear({ c: b });

	const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;

	// 正確なCIE L*計算
	const threshold = 216 / 24389;
	const multiplier = 24389 / 27;

	const result =
		luminance > threshold ? Math.pow(luminance, 1 / 3) * 116 - 16 : luminance * multiplier;

	return isFinite(result) ? result : 0;
};

/**
 * HSL明度を取得
 */
export const getHSLLightness = ({ r, g, b }: { r: number; g: number; b: number }): number => {
	const hsl = rgbToHSL({ r, g, b });
	return hsl.l;
};

/**
 * RGB平均明度を取得
 */
export const getAverageLightness = ({ r, g, b }: { r: number; g: number; b: number }): number => {
	const average = (r + g + b) / 3;
	return (average / 255) * 100;
};

/**
 * ハイブリッド明度を取得（知覚的明度 + HSL明度の加重平均）
 */
export const getHybridLightness = ({ r, g, b }: { r: number; g: number; b: number }): number => {
	const perceptual = getPerceptualLightness({ r, g, b });
	const hsl = rgbToHSL({ r, g, b });
	// 知覚明度とHSL明度の重み付き平均
	return perceptual * 0.3 + hsl.l * 0.7;
};

/**
 * 色から明度計算方法に応じた明度値を取得
 */
export const getLightness = ({
	color,
	lightnessMethod = 'hybrid'
}: {
	color: string;
	lightnessMethod?: LightnessMethod;
}): number => {
	const rgb = hexToRGB(color);

	switch (lightnessMethod) {
		case 'hsl':
			return getHSLLightness(rgb);
		case 'perceptual':
			return getPerceptualLightness(rgb);
		case 'average':
			return getAverageLightness(rgb);
		case 'hybrid':
		default:
			return getHybridLightness(rgb);
	}
};

// =============================================================================
// 明度調整関数
// =============================================================================

/**
 * 指定した明度になるように色を調整
 */
export const adjustToLightness = ({
	h,
	s,
	targetLightness,
	lightnessMethod = 'hybrid'
}: {
	h: number;
	s: number;
	targetLightness: number;
	lightnessMethod?: LightnessMethod;
}): string => {
	h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
	s = isFinite(s) ? Math.max(0, Math.min(100, s)) : 0;
	targetLightness = isFinite(targetLightness) ? targetLightness : 50;

	switch (lightnessMethod) {
		case 'hsl':
			return adjustToHSLLightness({ h, s, targetLightness });
		default:
			return adjustToLightnessByBinarySearch({ h, s, targetLightness, lightnessMethod });
	}
};

/**
 * HSL明度による直接調整（往復一貫性100%保証）
 */
const adjustToHSLLightness = ({
	h,
	s,
	targetLightness
}: {
	h: number;
	s: number;
	targetLightness: number;
}): string => {
	const hsl = { h, s, l: targetLightness };
	const rgb = hslToRGB(hsl);
	return rgbToHex(rgb);
};

/**
 * 二分探索による明度調整
 */
const adjustToLightnessByBinarySearch = ({
	h,
	s,
	targetLightness,
	lightnessMethod = 'hybrid'
}: {
	h: number;
	s: number;
	targetLightness: number;
	lightnessMethod?: LightnessMethod;
}): string => {
	const MAX_ITERATIONS = 100;
	const PRECISION_THRESHOLD = 0.001;

	let low = 0;
	let high = 100;
	let bestL = 50;
	let bestDiff = Infinity;

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const mid = (low + high) / 2;
		const rgb = hslToRGB({ h, s, l: mid });
		const currentLightness = getLightness({
			color: rgbToHex(rgb),
			lightnessMethod: lightnessMethod
		});
		const diff = Math.abs(currentLightness - targetLightness);

		// 最も誤差が小さいL値を記録
		if (diff < bestDiff) {
			bestDiff = diff;
			bestL = mid;
		}

		// 十分な精度に達したら終了
		if (diff < PRECISION_THRESHOLD) break;

		// 範囲が十分小さくなったら終了
		if (high - low < PRECISION_THRESHOLD) break;

		if (currentLightness < targetLightness) {
			low = mid;
		} else {
			high = mid;
		}
	}

	const finalRgb = hslToRGB({ h, s, l: bestL });
	return rgbToHex(finalRgb);
};

// =============================================================================
// スケール生成関数
// =============================================================================

/**
 * 指定カラーに最も近い明度レベルを見つける
 */
export const findClosestLevel = ({
	inputLightness,
	lightnessMethod = 'hybrid'
}: {
	inputLightness: number;
	lightnessMethod?: LightnessMethod;
}): number => {
	if (!isFinite(inputLightness)) inputLightness = 50;

	return SCALE_LEVELS.reduce((closestLevel, current) => {
		const lightness =
			lightnessMethod !== 'perceptual'
				? getAdjustedLightness({ level: current, lightnessMethod })
				: STANDARD_LIGHTNESS_SCALE[current];

		const currentDiff = Math.abs(inputLightness - lightness);
		const closestDiff = Math.abs(
			inputLightness -
				(lightnessMethod !== 'perceptual'
					? getAdjustedLightness({ level: closestLevel, lightnessMethod })
					: STANDARD_LIGHTNESS_SCALE[closestLevel])
		);

		return currentDiff < closestDiff ? current : closestLevel;
	});
};

/**
 * 指定カラーを基準に均等な階調を計算
 */
export const calculateEvenScale = ({
	inputLightness,
	baseLevel
}: {
	inputLightness: number;
	baseLevel: number;
}): Record<number, number> => {
	if (!isFinite(inputLightness)) inputLightness = 50;

	const clampedInputLightness = Math.max(MIN_LIGHTNESS, Math.min(MAX_LIGHTNESS, inputLightness));

	if (!SCALE_LEVELS.includes(baseLevel)) baseLevel = 500;

	const STEP_SIZE = 50;
	const baseIndex = (baseLevel - MIN_LEVEL) / STEP_SIZE;
	const totalSteps = (MAX_LEVEL - MIN_LEVEL) / STEP_SIZE;

	const upwardSteps = baseIndex;
	const downwardSteps = totalSteps - baseIndex;

	const availableUpward = MAX_LIGHTNESS - clampedInputLightness;
	const availableDownward = clampedInputLightness - MIN_LIGHTNESS;

	const upwardInterval = upwardSteps > 0 ? availableUpward / upwardSteps : 0;
	const downwardInterval = downwardSteps > 0 ? availableDownward / downwardSteps : 0;

	const evenScale: Record<number, number> = {};
	evenScale[baseLevel] = clampedInputLightness;

	// 上位レベル（明るい方向）
	for (let i = 1; i <= upwardSteps; i++) {
		const level = baseLevel - i * STEP_SIZE;
		const lightness = Math.min(clampedInputLightness + upwardInterval * i, MAX_LIGHTNESS);
		evenScale[level] = lightness;
	}

	// 下位レベル（暗い方向）
	for (let i = 1; i <= downwardSteps; i++) {
		const level = baseLevel + i * STEP_SIZE;
		const lightness = Math.max(clampedInputLightness - downwardInterval * i, MIN_LIGHTNESS);
		evenScale[level] = lightness;
	}

	// 結果をクランプして返す
	const adjustedLightnessScale: Record<number, number> = {};
	SCALE_LEVELS.forEach((level) => {
		if (evenScale[level] !== undefined) {
			adjustedLightnessScale[level] = Math.max(
				MIN_LIGHTNESS,
				Math.min(MAX_LIGHTNESS, evenScale[level])
			);
		}
	});

	return adjustedLightnessScale;
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * メソッドに応じた調整済み明度を取得
 */
const getAdjustedLightness = ({
	level,
	lightnessMethod
}: {
	level: number;
	lightnessMethod: LightnessMethod;
}): number => {
	const normalizedLevel = (level - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);

	switch (lightnessMethod) {
		case 'hsl':
		case 'average':
			return MAX_LIGHTNESS - normalizedLevel * (MAX_LIGHTNESS - MIN_LIGHTNESS);
		case 'hybrid':
			const perceptualLightness = STANDARD_LIGHTNESS_SCALE[level];
			const linearLightness = MAX_LIGHTNESS - normalizedLevel * (MAX_LIGHTNESS - MIN_LIGHTNESS);
			return perceptualLightness * 0.3 + linearLightness * 0.7;
		case 'perceptual':
		default:
			return STANDARD_LIGHTNESS_SCALE[level];
	}
};
