// hueShift.ts

import { hexToHSL } from './colorUtils';
import type { ColorConfig, HueShiftMode } from './types';

// =============================================================================
// 色相変化計算関数
// =============================================================================

/**
 * 色相変化を計算する
 */
export const calculateHueShift = ({
	baseHue,
	baseLightness,
	targetLightness,
	adjustedLightnessScale,
	hueShiftMode
}: {
	baseHue: number;
	baseLightness: number;
	targetLightness: number;
	adjustedLightnessScale: Record<number, number>;
	hueShiftMode: HueShiftMode;
}): number => {
	const MAX_HUE_SHIFT = 30;

	// fixedモードの場合は変化なし
	if (hueShiftMode === 'fixed') {
		return baseHue;
	}

	const lightnessDiff = targetLightness - baseLightness;

	// 知覚ベースの動的計算を使用
	const hueBasedIntensity = calculateHueIntensityByHue(baseHue);
	const lightnessBasedIntensity = calculateHueIntensityByLightness(
		lightnessDiff,
		adjustedLightnessScale
	);

	// シフト量＆方向を取得
	let hueShift = hueBasedIntensity * lightnessBasedIntensity * MAX_HUE_SHIFT;

	// unnaturalモードでは方向を反転
	if (hueShiftMode === 'unnatural') {
		hueShift = -hueShift;
	}

	const newHue = baseHue + hueShift;
	return normalizeHue(newHue);
};

/**
 * 色相に基づく色相変化強度を計算
 */
export const calculateHueIntensityByHue = (hue: number): number => {
	const normalizedHue = normalizeHue(hue);
	const radians = (normalizedHue * Math.PI) / 180;

	// MacAdam楕円に基づく知覚感度曲線の近似
	// 赤(0°)と青(240°)で高く、黄緑(60°)付近で低い
	const perceptualSensitivity = 0.3 + (0.5 * (1 + Math.cos(radians - Math.PI / 3))) / 2;

	// 温度変化による色相シフトの方向
	// 暖色系(0-180°): 明るく→黄色寄り(+), 暗く→マゼンタ寄り(-)
	// 寒色系(180-360°): 明るく→緑寄り(-), 暗く→青/紫寄り(+)
	const temperatureDirection = Math.cos(radians);

	// 知覚感度と温度方向を組み合わせ
	return perceptualSensitivity * temperatureDirection;
};

/**
 * 明度差に基づく色相変化強度を計算
 */
const calculateHueIntensityByLightness = (
	lightnessDiff: number,
	adjustedLightnessScale: Record<number, number>
): number => {
	const minLightness = Math.min(...Object.values(adjustedLightnessScale));
	const maxLightness = Math.max(...Object.values(adjustedLightnessScale));
	const actualRange = maxLightness - minLightness;

	// 符号を保持したまま正規化（-1 〜 +1 の範囲）
	const normalizedDiff = lightnessDiff / actualRange;
	return Math.max(-1, Math.min(normalizedDiff, 1));
};

/**
 * 色相を0-360の範囲に正規化
 */
export const normalizeHue = (hue: number): number => {
	while (hue < 0) hue += 360;
	while (hue >= 360) hue -= 360;
	return hue;
};

// =============================================================================
// 色相変化の方向性説明を取得
// =============================================================================

/**
 * 色相変化の方向性説明を取得
 */
export const getHueShiftExplanation = ({
	colorConfig
}: {
	colorConfig: ColorConfig;
}): {
	category: string;
	lighterDirection: string;
	darkerDirection: string;
	lighterSign: string;
	darkerSign: string;
} => {
	const { hueShiftMode } = colorConfig;
	const baseHSL = hexToHSL(colorConfig.color);
	const hueCategory = getHueCategory(baseHSL.h);
	const category = getHueCategoryJapanese(baseHSL.h);

	// fixedモードは変化なし
	if (hueShiftMode === 'fixed') {
		return {
			category,
			lighterDirection: '変化なし',
			darkerDirection: '変化なし',
			lighterSign: '',
			darkerSign: ''
		};
	}

	// 動的計算での強度値を取得
	const intensity = calculateHueIntensityByHue(baseHSL.h);
	const directions =
		HUE_DIRECTION_EXPLANATION_MAP[hueCategory as keyof typeof HUE_DIRECTION_EXPLANATION_MAP];

	// 符号付き強度値から方向を決定
	const isPositiveIntensity = intensity > 0;
	const naturalConfig = {
		lighterSign: isPositiveIntensity ? '+' : '-',
		darkerSign: isPositiveIntensity ? '-' : '+',
		lighterDirection: directions.lighter,
		darkerDirection: directions.darker
	};

	// unnaturalモードでは符号と方向を反転
	if (hueShiftMode === 'unnatural') {
		return {
			category,
			lighterSign: naturalConfig.lighterSign === '+' ? '-' : '+',
			darkerSign: naturalConfig.darkerSign === '+' ? '-' : '+',
			lighterDirection: naturalConfig.darkerDirection,
			darkerDirection: naturalConfig.lighterDirection
		};
	}

	return { category, ...naturalConfig };
};

/**
 * 色相のカテゴリを判定
 */
export const getHueCategory = (hue: number): string => {
	const normalizedHue = normalizeHue(hue);

	if (normalizedHue < 30 || normalizedHue >= 330) return 'red';
	if (normalizedHue < 60) return 'orange';
	if (normalizedHue < 90) return 'yellow';
	if (normalizedHue < 150) return 'green';
	if (normalizedHue < 210) return 'cyan';
	if (normalizedHue < 270) return 'blue';
	return 'purple';
};

/**
 * 色相カテゴリの日本語名を取得
 */
export const getHueCategoryJapanese = (hue: number): string => {
	const category = getHueCategory(hue);
	const categoryNames = {
		red: '赤系',
		orange: 'オレンジ系',
		yellow: '黄系',
		green: '緑系',
		cyan: 'シアン系',
		blue: '青系',
		purple: '紫系'
	};
	return categoryNames[category as keyof typeof categoryNames];
};

// 色相方向性説明のマスターデータ
const HUE_DIRECTION_EXPLANATION_MAP = {
	red: { lighter: 'オレンジ/黄色寄り', darker: '深い赤/マゼンタ寄り' },
	orange: { lighter: '黄色寄り', darker: '赤寄り' },
	yellow: { lighter: '緑寄り', darker: 'オレンジ寄り' },
	green: { lighter: '黄緑寄り', darker: '青緑寄り' },
	cyan: { lighter: '緑寄り', darker: '青寄り' },
	blue: { lighter: 'シアン寄り', darker: '紫寄り' },
	purple: { lighter: 'ピンク/マゼンタ寄り', darker: '深い紫/青寄り' }
} as const;
