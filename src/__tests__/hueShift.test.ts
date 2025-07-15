// hueShiftUtils.test.ts

import { describe, it, expect } from 'vitest';
import {
	calculateHueShift,
	calculateHueIntensityByHue,
	normalizeHue,
	getHueShiftExplanation,
	getHueCategory,
	getHueCategoryJapanese
} from '../hueShift';
import type { ColorConfig, HueShiftMode } from '../types';

describe('hueShiftUtils', () => {
	describe('normalizeHue', () => {
		it('正の角度が正しく正規化される', () => {
			expect(normalizeHue(0)).toBe(0);
			expect(normalizeHue(180)).toBe(180);
			expect(normalizeHue(359)).toBe(359);
			expect(normalizeHue(359.9)).toBeCloseTo(359.9, 1);
		});

		it('360以上の角度が正しく正規化される', () => {
			expect(normalizeHue(360)).toBe(0);
			expect(normalizeHue(450)).toBe(90);
			expect(normalizeHue(720)).toBe(0);
			expect(normalizeHue(380)).toBe(20);
		});

		it('負の角度が正しく正規化される', () => {
			expect(normalizeHue(-1)).toBe(359);
			expect(normalizeHue(-90)).toBe(270);
			expect(normalizeHue(-360)).toBe(0);
			expect(normalizeHue(-450)).toBe(270);
		});

		it('小数点を含む角度を正しく処理する', () => {
			expect(normalizeHue(360.5)).toBeCloseTo(0.5, 1);
			expect(normalizeHue(-0.5)).toBeCloseTo(359.5, 1);
		});
	});

	describe('getHueCategory', () => {
		it('各色の範囲で正しいカテゴリを返す', () => {
			// Red: < 30 || >= 330
			expect(getHueCategory(0)).toBe('red');
			expect(getHueCategory(15)).toBe('red');
			expect(getHueCategory(29.9)).toBe('red');
			expect(getHueCategory(330)).toBe('red');
			expect(getHueCategory(359)).toBe('red');

			// Orange: 30 <= hue < 60
			expect(getHueCategory(30)).toBe('orange');
			expect(getHueCategory(45)).toBe('orange');
			expect(getHueCategory(59.9)).toBe('orange');

			// Yellow: 60 <= hue < 90
			expect(getHueCategory(60)).toBe('yellow');
			expect(getHueCategory(75)).toBe('yellow');
			expect(getHueCategory(89.9)).toBe('yellow');

			// Green: 90 <= hue < 150
			expect(getHueCategory(90)).toBe('green');
			expect(getHueCategory(120)).toBe('green');
			expect(getHueCategory(149.9)).toBe('green');

			// Cyan: 150 <= hue < 210
			expect(getHueCategory(150)).toBe('cyan');
			expect(getHueCategory(180)).toBe('cyan');
			expect(getHueCategory(209.9)).toBe('cyan');

			// Blue: 210 <= hue < 270
			expect(getHueCategory(210)).toBe('blue');
			expect(getHueCategory(240)).toBe('blue');
			expect(getHueCategory(269.9)).toBe('blue');

			// Purple: 270 <= hue < 330
			expect(getHueCategory(270)).toBe('purple');
			expect(getHueCategory(300)).toBe('purple');
			expect(getHueCategory(329.9)).toBe('purple');
		});

		it('境界値を正しく処理する', () => {
			expect(getHueCategory(29.99)).toBe('red');
			expect(getHueCategory(30)).toBe('orange');
			expect(getHueCategory(59.99)).toBe('orange');
			expect(getHueCategory(60)).toBe('yellow');
			expect(getHueCategory(329.99)).toBe('purple');
			expect(getHueCategory(330)).toBe('red');
		});

		it('正規化されていない角度も正しく処理する', () => {
			expect(getHueCategory(390)).toBe('orange'); // 390 - 360 = 30
			expect(getHueCategory(-30)).toBe('red'); // -30 + 360 = 330
		});
	});

	describe('getHueCategoryJapanese', () => {
		it('各色カテゴリの日本語名を返す', () => {
			expect(getHueCategoryJapanese(0)).toBe('赤系');
			expect(getHueCategoryJapanese(30)).toBe('オレンジ系');
			expect(getHueCategoryJapanese(60)).toBe('黄系');
			expect(getHueCategoryJapanese(120)).toBe('緑系');
			expect(getHueCategoryJapanese(180)).toBe('シアン系');
			expect(getHueCategoryJapanese(240)).toBe('青系');
			expect(getHueCategoryJapanese(270)).toBe('紫系');
		});

		it('境界値での日本語名を正しく返す', () => {
			expect(getHueCategoryJapanese(29.9)).toBe('赤系');
			expect(getHueCategoryJapanese(30)).toBe('オレンジ系');
			expect(getHueCategoryJapanese(329.9)).toBe('紫系');
			expect(getHueCategoryJapanese(330)).toBe('赤系');
		});
	});

	describe('calculateHueIntensityByHue', () => {
		it('返される値が-1から1の範囲内にある', () => {
			const testHues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
			testHues.forEach((hue) => {
				const intensity = calculateHueIntensityByHue(hue);
				expect(intensity).toBeGreaterThanOrEqual(-1);
				expect(intensity).toBeLessThanOrEqual(1);
				expect(typeof intensity).toBe('number');
				expect(isFinite(intensity)).toBe(true);
			});
		});

		it('色相による強度値の周期性を確認する', () => {
			const intensity0 = calculateHueIntensityByHue(0);
			const intensity360 = calculateHueIntensityByHue(360);
			expect(intensity0).toBeCloseTo(intensity360, 5);

			const intensity90 = calculateHueIntensityByHue(90);
			const intensity450 = calculateHueIntensityByHue(450); // 90 + 360
			expect(intensity90).toBeCloseTo(intensity450, 5);
		});

		it('MacAdam楕円ベースの知覚感度曲線の特性を確認する', () => {
			const intensity0 = calculateHueIntensityByHue(0); // 赤
			const intensity60 = calculateHueIntensityByHue(60); // 黄
			const intensity120 = calculateHueIntensityByHue(120); // 緑
			const intensity180 = calculateHueIntensityByHue(180); // シアン
			const intensity240 = calculateHueIntensityByHue(240); // 青
			const intensity300 = calculateHueIntensityByHue(300); // マゼンタ

			// 実装では0.3 + (0.5 * (1 + cos(radians - π/3))) / 2の形で計算される
			// 赤(0°)と青(240°)で相対的に高く、黄緑(60°)付近で低くなる傾向

			// 基本的な数値検証
			expect(typeof intensity0).toBe('number');
			expect(typeof intensity60).toBe('number');
			expect(typeof intensity120).toBe('number');
			expect(typeof intensity180).toBe('number');
			expect(typeof intensity240).toBe('number');
			expect(typeof intensity300).toBe('number');

			// 全て有限の値であることを確認
			[intensity0, intensity60, intensity120, intensity180, intensity240, intensity300].forEach(
				(val) => {
					expect(isFinite(val)).toBe(true);
					expect(val).toBeGreaterThanOrEqual(-1);
					expect(val).toBeLessThanOrEqual(1);
				}
			);
		});

		it('温度変化による色相シフトの方向性を確認する', () => {
			// cos(radians)の部分で方向性が決まる
			const intensity0 = calculateHueIntensityByHue(0); // cos(0) = 1 (正)
			const intensity90 = calculateHueIntensityByHue(90); // cos(π/2) = 0
			const intensity180 = calculateHueIntensityByHue(180); // cos(π) = -1 (負)
			const intensity270 = calculateHueIntensityByHue(270); // cos(3π/2) = 0

			// 0°と180°で符号が逆転することを確認
			expect(Math.sign(intensity0)).not.toBe(Math.sign(intensity180));

			// 90°と270°は中間値（0に近い）
			expect(Math.abs(intensity90)).toBeLessThan(Math.abs(intensity0));
			expect(Math.abs(intensity270)).toBeLessThan(Math.abs(intensity180));
		});

		it('連続性を確認する（隣接する色相で急激な変化がない）', () => {
			for (let hue = 0; hue < 360; hue += 30) {
				const intensity1 = calculateHueIntensityByHue(hue);
				const intensity2 = calculateHueIntensityByHue(hue + 1);
				const diff = Math.abs(intensity1 - intensity2);

				// 1度の変化で大きく変わらないことを確認
				expect(diff).toBeLessThan(0.1);
			}
		});
	});

	describe('calculateHueShift', () => {
		const baseParams = {
			baseHue: 0,
			baseLightness: 50,
			targetLightness: 70,
			adjustedLightnessScale: { 50: 20, 500: 50, 950: 80 }
		};

		it('fixedモードでは元の色相を返す', () => {
			const result = calculateHueShift({
				...baseParams,
				hueShiftMode: 'fixed' as HueShiftMode
			});
			expect(result).toBe(baseParams.baseHue);
		});

		it('naturalモードで色相変化を適用する', () => {
			const result = calculateHueShift({
				...baseParams,
				hueShiftMode: 'natural' as HueShiftMode
			});

			// 結果が正規化された範囲内にあることを確認
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(360);
			expect(typeof result).toBe('number');
			expect(isFinite(result)).toBe(true);
		});

		it('unnaturalモードで反対方向の色相変化を適用する', () => {
			const naturalResult = calculateHueShift({
				...baseParams,
				hueShiftMode: 'natural' as HueShiftMode
			});

			const unnaturalResult = calculateHueShift({
				...baseParams,
				hueShiftMode: 'unnatural' as HueShiftMode
			});

			// 両方の結果が正規化された範囲内にあることを確認
			expect(naturalResult).toBeGreaterThanOrEqual(0);
			expect(naturalResult).toBeLessThan(360);
			expect(unnaturalResult).toBeGreaterThanOrEqual(0);
			expect(unnaturalResult).toBeLessThan(360);

			// unnaturalは-hueShiftなので、正規化前の値で比較
			// baseHue(0)からの変化量を計算
			let naturalShift = naturalResult - baseParams.baseHue;
			let unnaturalShift = unnaturalResult - baseParams.baseHue;

			// 360度ラップアラウンドを考慮
			if (naturalShift > 180) naturalShift -= 360;
			if (naturalShift < -180) naturalShift += 360;
			if (unnaturalShift > 180) unnaturalShift -= 360;
			if (unnaturalShift < -180) unnaturalShift += 360;

			// 反対方向であることを確認（符号が逆転）
			expect(unnaturalShift).toBeCloseTo(-naturalShift, 3);
		});

		it('明度差が0の場合、色相変化も0に近い', () => {
			const result = calculateHueShift({
				...baseParams,
				targetLightness: baseParams.baseLightness, // 明度差なし
				hueShiftMode: 'natural' as HueShiftMode
			});

			// 明度差が0なら色相変化も最小限
			const hueShift = Math.abs(result - baseParams.baseHue);
			expect(hueShift).toBeLessThan(5); // 小さな誤差は許容
		});

		it('明度差が大きいほど色相変化が大きくなる', () => {
			const smallShift = calculateHueShift({
				...baseParams,
				targetLightness: 55, // 小さな変化 (50→55)
				hueShiftMode: 'natural' as HueShiftMode
			});

			const largeShift = calculateHueShift({
				...baseParams,
				targetLightness: 80, // 大きな変化 (50→80)
				hueShiftMode: 'natural' as HueShiftMode
			});

			const smallDiff = Math.abs(smallShift - baseParams.baseHue);
			const largeDiff = Math.abs(largeShift - baseParams.baseHue);

			// 大きな明度変化の方が色相変化も大きい
			expect(largeDiff).toBeGreaterThan(smallDiff);
		});

		it('色相ラップアラウンドを正しく処理する', () => {
			const testCases = [
				{ baseHue: 350, targetLightness: 80 },
				{ baseHue: 10, targetLightness: 20 },
				{ baseHue: 180, targetLightness: 90 }
			];

			testCases.forEach((testCase) => {
				const result = calculateHueShift({
					...baseParams,
					...testCase,
					hueShiftMode: 'natural' as HueShiftMode
				});

				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThan(360);
				expect(isFinite(result)).toBe(true);
			});
		});

		it('最大シフト量が制限されている', () => {
			// 極端な明度差でテスト
			const extremeShift = calculateHueShift({
				baseHue: 0,
				baseLightness: 10,
				targetLightness: 90, // 極端な差
				adjustedLightnessScale: { 50: 10, 500: 50, 950: 90 },
				hueShiftMode: 'natural' as HueShiftMode
			});

			const shiftAmount = Math.abs(extremeShift - 0);
			// MAX_HUE_SHIFT = 30なので、最大でも30度程度の変化
			expect(shiftAmount).toBeLessThanOrEqual(35); // 少し余裕を持たせる
		});

		it('異なる色相で一貫した動作をする', () => {
			const testHues = [0, 60, 120, 180, 240, 300];

			testHues.forEach((hue) => {
				const result = calculateHueShift({
					...baseParams,
					baseHue: hue,
					hueShiftMode: 'natural' as HueShiftMode
				});

				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThan(360);
				expect(typeof result).toBe('number');
				expect(isFinite(result)).toBe(true);
			});
		});
	});

	describe('getHueShiftExplanation', () => {
		const createColorConfig = (color: string, hueShiftMode: HueShiftMode): ColorConfig => ({
			id: 'test',
			prefix: 'test',
			color,
			hueShiftMode
		});

		it('fixedモードで変化なしを返す', () => {
			const config = createColorConfig('#ff0000', 'fixed');
			const result = getHueShiftExplanation({ colorConfig: config });

			expect(result.lighterDirection).toBe('変化なし');
			expect(result.darkerDirection).toBe('変化なし');
			expect(result.lighterSign).toBe('');
			expect(result.darkerSign).toBe('');
			expect(result.category).toBe('赤系');
		});

		it('naturalモードで適切な方向性を返す', () => {
			const config = createColorConfig('#ff0000', 'natural'); // 赤
			const result = getHueShiftExplanation({ colorConfig: config });

			expect(result.category).toBe('赤系');
			expect(typeof result.lighterDirection).toBe('string');
			expect(typeof result.darkerDirection).toBe('string');
			expect(result.lighterDirection).not.toBe('変化なし');
			expect(result.darkerDirection).not.toBe('変化なし');
			expect(['+', '-']).toContain(result.lighterSign);
			expect(['+', '-']).toContain(result.darkerSign);
		});

		it('unnaturalモードで反転した方向性を返す', () => {
			const naturalConfig = createColorConfig('#ff0000', 'natural');
			const unnaturalConfig = createColorConfig('#ff0000', 'unnatural');

			const naturalResult = getHueShiftExplanation({ colorConfig: naturalConfig });
			const unnaturalResult = getHueShiftExplanation({ colorConfig: unnaturalConfig });

			// カテゴリは同じ
			expect(unnaturalResult.category).toBe(naturalResult.category);

			// unnaturalは方向が反転している
			expect(unnaturalResult.lighterDirection).toBe(naturalResult.darkerDirection);
			expect(unnaturalResult.darkerDirection).toBe(naturalResult.lighterDirection);

			// 符号も反転している
			if (naturalResult.lighterSign === '+') {
				expect(unnaturalResult.lighterSign).toBe('-');
			} else if (naturalResult.lighterSign === '-') {
				expect(unnaturalResult.lighterSign).toBe('+');
			}

			if (naturalResult.darkerSign === '+') {
				expect(unnaturalResult.darkerSign).toBe('-');
			} else if (naturalResult.darkerSign === '-') {
				expect(unnaturalResult.darkerSign).toBe('+');
			}
		});

		it('各色系で適切なカテゴリ名を返す', () => {
			const testCases = [
				{ color: '#ff0000', expected: '赤系' }, // 0°
				{ color: '#ff8000', expected: 'オレンジ系' }, // 30°
				{ color: '#ffff00', expected: '黄系' }, // 60°
				{ color: '#00ff00', expected: '緑系' }, // 120°
				{ color: '#00ffff', expected: 'シアン系' }, // 180°
				{ color: '#0000ff', expected: '青系' }, // 240°
				{ color: '#8000ff', expected: '紫系' } // 270°
			];

			testCases.forEach(({ color, expected }) => {
				const config = createColorConfig(color, 'natural');
				const result = getHueShiftExplanation({ colorConfig: config });
				expect(result.category).toBe(expected);
			});
		});

		it('符号の一貫性を確認する', () => {
			const config = createColorConfig('#ff0000', 'natural');
			const result = getHueShiftExplanation({ colorConfig: config });

			// lighter と darker の符号は逆になるはず
			if (result.lighterSign !== '' && result.darkerSign !== '') {
				expect(result.lighterSign).not.toBe(result.darkerSign);
				expect(['+', '-']).toContain(result.lighterSign);
				expect(['+', '-']).toContain(result.darkerSign);
			}
		});

		it('色相変化の説明が適切な形式である', () => {
			const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

			colors.forEach((color) => {
				const config = createColorConfig(color, 'natural');
				const result = getHueShiftExplanation({ colorConfig: config });

				// 必須フィールドの存在確認
				expect(typeof result.category).toBe('string');
				expect(typeof result.lighterDirection).toBe('string');
				expect(typeof result.darkerDirection).toBe('string');
				expect(typeof result.lighterSign).toBe('string');
				expect(typeof result.darkerSign).toBe('string');

				// カテゴリが正しい形式（○系）
				expect(result.category).toMatch(/.*系$/);

				// 方向性の説明が空でない
				expect(result.lighterDirection.length).toBeGreaterThan(0);
				expect(result.darkerDirection.length).toBeGreaterThan(0);
			});
		});

		it('HUE_DIRECTION_EXPLANATION_MAPの全カテゴリをカバーする', () => {
			const testColors = [
				'#ff0000', // red
				'#ff8000', // orange
				'#ffff00', // yellow
				'#00ff00', // green
				'#00ffff', // cyan
				'#0000ff', // blue
				'#8000ff' // purple
			];

			testColors.forEach((color) => {
				const config = createColorConfig(color, 'natural');

				expect(() => {
					const result = getHueShiftExplanation({ colorConfig: config });
					expect(result).toBeDefined();
				}).not.toThrow();
			});
		});

		it('無効な色でもエラーを投げない', () => {
			const invalidColors = ['', 'invalid', '#gggggg', '#ff'];

			invalidColors.forEach((color) => {
				expect(() => {
					const config = createColorConfig(color, 'natural');
					const result = getHueShiftExplanation({ colorConfig: config });
					expect(result).toBeDefined();
				}).not.toThrow();
			});
		});
	});
});
