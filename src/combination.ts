// combination.ts

import { hexToHSL } from './colorUtils';
import { adjustToLightness, getLightness } from './lightness';
import { normalizeHue } from './hueShift';
import type {
	ColorConfig,
	HSL,
	LightnessMethod,
	CombinationType,
	BaseColorStrategy,
	CombinationConfig,
	Combination
} from './types';
import {
	STANDARD_LIGHTNESS_SCALE,
	DEFAULT_COLOR_CONFIG,
	DEFAULT_BASE_COLOR_CONFIG
} from './constants';

// =============================================================================
// カラーコンビネーション生成
// =============================================================================

/**
 * プライマリカラーから調和のとれたカラーコンビネーションを生成
 */
export const generateCombination = (config: CombinationConfig): Combination => {
	const combinationType = config.combinationType || 'complementary';
	const primaryHSL = hexToHSL(config.primaryColor);
	const lightnessMethod = config.lightnessMethod || 'hybrid';
	const baseColorStrategy = config.baseColorStrategy || 'harmonic';

	const baseColorConfig = generateBaseColorConfig({
		primaryHSL,
		lightnessMethod,
		strategy: baseColorStrategy
	});
	const primaryColorConfig = {
		...DEFAULT_COLOR_CONFIG,
		id: 'primary',
		prefix: 'primary',
		color: config.primaryColor,
		lightnessMethod
	};
	const secondaryColorConfigs = generateSecondaryColorConfigs({
		primaryHSL,
		combinationType,
		lightnessMethod,
		primaryColor: config.primaryColor
	});

	return [baseColorConfig, primaryColorConfig, ...secondaryColorConfigs];
};

// =============================================================================
// ColorConfig構築
// =============================================================================

/**
 * ベースカラーのConfigを生成
 */
const generateBaseColorConfig = ({
	primaryHSL,
	lightnessMethod = 'hybrid',
	strategy = 'harmonic'
}: {
	primaryHSL: HSL;
	lightnessMethod?: LightnessMethod;
	strategy?: BaseColorStrategy;
}): ColorConfig => {
	const baseColor = getBaseColor({ primaryHSL, lightnessMethod, strategy });

	return {
		...DEFAULT_BASE_COLOR_CONFIG,
		id: 'base',
		prefix: 'base',
		color: baseColor,
		lightnessMethod
	};
};

/**
 * セカンダリカラー群のConfigを生成
 */
const generateSecondaryColorConfigs = ({
	primaryHSL,
	combinationType,
	lightnessMethod,
	primaryColor
}: {
	primaryHSL: HSL;
	combinationType: CombinationType;
	lightnessMethod: LightnessMethod;
	primaryColor: string;
}): ColorConfig[] => {
	if (combinationType === 'monochromatic') {
		return [];
	}

	const secondaryColors = getSecondaryColors({
		primaryHSL,
		combinationType,
		lightnessMethod,
		primaryColor
	});
	const configs: ColorConfig[] = [];

	const secondaryColorMap = [
		{ id: 'secondary', prefix: 'secondary', color: secondaryColors.secondary }, // 第二の
		{ id: 'secondary2', prefix: 'secondary2', color: secondaryColors.secondary2 }, // 第三の
		{ id: 'secondary3', prefix: 'secondary3', color: secondaryColors.secondary3 } // 第四の
	];

	for (const { id, color, prefix } of secondaryColorMap) {
		if (color) {
			configs.push({
				...DEFAULT_COLOR_CONFIG,
				id,
				prefix,
				color,
				lightnessMethod
			});
		}
	}

	return configs;
};

// =============================================================================
// カラー生成
// =============================================================================

/**
 * ベースカラーを取得（最終的な色文字列）
 */
const getBaseColor = ({
	primaryHSL,
	lightnessMethod = 'hybrid',
	strategy = 'harmonic'
}: {
	primaryHSL: HSL;
	lightnessMethod?: LightnessMethod;
	strategy?: BaseColorStrategy;
}): string => {
	const targetLightness = STANDARD_LIGHTNESS_SCALE[500]; // 500番台相当
	const baseSaturation = Math.max(5, Math.min(15, primaryHSL.s * 0.1));

	const strategyMap: Record<BaseColorStrategy, { baseHue: number; finalSaturation: number }> = {
		harmonic: { baseHue: primaryHSL.h, finalSaturation: baseSaturation },
		contrasting: { baseHue: normalizeHue(primaryHSL.h + 180), finalSaturation: baseSaturation },
		neutral: { baseHue: 0, finalSaturation: 0 }
	};

	const { baseHue, finalSaturation } = strategyMap[strategy] || strategyMap.harmonic;

	return adjustToLightness({
		h: baseHue,
		s: finalSaturation,
		targetLightness,
		lightnessMethod: lightnessMethod
	});
};

/**
 * セカンダリカラーを取得（最終的な色文字列）
 */
const getSecondaryColors = ({
	primaryHSL,
	combinationType,
	lightnessMethod,
	primaryColor
}: {
	primaryHSL: HSL;
	combinationType: CombinationType;
	lightnessMethod: LightnessMethod;
	primaryColor: string;
}): {
	secondary?: string;
	secondary2?: string;
	secondary3?: string;
} => {
	const { h: primaryHue } = primaryHSL;

	const combinationMap: Record<
		CombinationType,
		{
			secondary?: HSL;
			secondary2?: HSL;
			secondary3?: HSL;
		}
	> = {
		monochromatic: {
			secondary: primaryHSL
		},
		analogous: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 30) },
			secondary2: { ...primaryHSL, h: normalizeHue(primaryHue - 30) }
		},
		complementary: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 180) }
		},
		splitComplementary: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 150) },
			secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 210) }
		},
		doubleComplementary: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 30) },
			secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
			secondary3: { ...primaryHSL, h: normalizeHue(primaryHue + 210) }
		},
		doubleComplementaryReverse: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue - 30) },
			secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
			secondary3: { ...primaryHSL, h: normalizeHue(primaryHue + 150) }
		},
		triadic: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 120) },
			secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 240) }
		},
		tetradic: {
			secondary: { ...primaryHSL, h: normalizeHue(primaryHue + 90) },
			secondary2: { ...primaryHSL, h: normalizeHue(primaryHue + 180) },
			secondary3: { ...primaryHSL, h: normalizeHue(primaryHue + 270) }
		}
	};

	const hslValues = combinationMap[combinationType] || combinationMap.complementary;

	const result: {
		secondary?: string;
		secondary2?: string;
		secondary3?: string;
	} = {};

	const keys = ['secondary', 'secondary2', 'secondary3'] as const;
	for (const key of keys) {
		const hsl = hslValues[key];
		if (hsl) {
			result[key] = adjustColorToPrimaryTone({
				targetHSL: hsl,
				primaryHSL,
				lightnessMethod,
				primaryColor
			});
		}
	}

	return result;
};

// =============================================================================
// カラー調整
// =============================================================================

/**
 * プライマリカラーのトーン（彩度・明度）に合わせて色相を調整
 */
const adjustColorToPrimaryTone = ({
	targetHSL,
	primaryHSL,
	lightnessMethod = 'hybrid',
	primaryColor
}: {
	targetHSL: HSL;
	primaryHSL: HSL;
	lightnessMethod?: LightnessMethod;
	primaryColor?: string;
}): string => {
	const targetLightness = primaryColor
		? getLightness({ color: primaryColor, lightnessMethod: lightnessMethod })
		: primaryHSL.l; // フォールバック

	return adjustToLightness({
		h: targetHSL.h,
		s: primaryHSL.s,
		targetLightness,
		lightnessMethod: lightnessMethod
	});
};
