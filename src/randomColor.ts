// randomColor.ts

import { adjustToLightness } from './lightness';
import type { RandomColorConfig } from './types';
import { DEFAULT_RANDOM_COLOR_CONFIG } from './constants';

// =============================================================================
// ランダムプライマリーカラー生成機能
// =============================================================================

/**
 * ランダムなプライマリーカラーを生成
 * @param options 生成オプション
 * @returns HEX文字列
 */
export function generateRandomPrimaryColor(config: RandomColorConfig = {}): string {
	const perfectConfig = { ...DEFAULT_RANDOM_COLOR_CONFIG, ...config };

	// 色相をランダム生成
	const [minHue, maxHue] = perfectConfig.hueRange;
	const hue = Math.random() * (maxHue - minHue) + minHue;

	// 明度をランダム生成
	const [minLightness, maxLightness] = perfectConfig.lightnessRange;
	const lightness = Math.random() * (maxLightness - minLightness) + minLightness;

	// 彩度をランダム生成
	const [minSat, maxSat] = perfectConfig.saturationRange;
	const saturation = Math.random() * (maxSat - minSat) + minSat;

	// 指定された明度になるよう調整してHEX文字列を返す
	return adjustToLightness({
		h: hue,
		s: saturation,
		targetLightness: lightness,
		lightnessMethod: perfectConfig.lightnessMethod
	});
}

/**
 * 特定の色相範囲でランダムカラーを生成
 * @param baseHue ベース色相
 * @param range 色相の範囲（±度）
 * @param options その他のオプション
 * @returns HEX文字列
 */
export function generateRandomColorAroundHue(
	baseHue: number,
	range: number = 30,
	config: Omit<RandomColorConfig, 'hueRange'> = {}
): string {
	const minHue = (baseHue - range + 360) % 360;
	const maxHue = (baseHue + range + 360) % 360;

	// 範囲が0度をまたぐ場合の処理
	let hueRange: [number, number];
	if (minHue > maxHue) {
		// 0度をまたぐ場合は、0-maxHueまたはminHue-360のランダム選択
		const useUpperRange = Math.random() > 0.5;
		hueRange = useUpperRange ? [minHue, 360] : [0, maxHue];
	} else {
		hueRange = [minHue, maxHue];
	}

	return generateRandomPrimaryColor({
		...config,
		hueRange
	});
}
