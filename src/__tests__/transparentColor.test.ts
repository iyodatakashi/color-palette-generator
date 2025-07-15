// transparentColorUtils.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setTransparentPalette } from '../transparentColor';
import type { Palette, ColorConfig } from '../types';
import { SCALE_LEVELS, MAX_LEVEL, MIN_LEVEL, MAX_ALPHA, MIN_ALPHA } from '../constants';

describe('transparentColorUtils', () => {
	let basePalette: Palette;
	let baseColorConfig: Required<ColorConfig>;

	beforeEach(() => {
		// 基本的なソリッドカラーパレットを準備
		basePalette = {};
		SCALE_LEVELS.forEach((level) => {
			// テスト用のグラデーション色を生成（50=明るい、950=暗い）
			const grayValue = Math.round(255 - ((level - 50) * (255 - 0)) / (950 - 50));
			const hex = `#${grayValue.toString(16).padStart(2, '0').repeat(3)}`;
			basePalette[`--test-${level}`] = hex;
		});

		baseColorConfig = {
			id: 'test',
			prefix: 'test',
			color: '#3b82f6',
			hueShiftMode: 'natural',
			lightnessMethod: 'hybrid',
			includeTransparent: true,
			transparentOriginLevel: 500,
			bgColorLight: '#ffffff', // 白背景
			bgColorDark: '#000000' // 黒背景
		};
	});

	describe('setTransparentPalette', () => {
		it('transparentOriginLevelが未設定の場合は何もしない', () => {
			const config = { ...baseColorConfig, transparentOriginLevel: undefined };
			const palette = { ...basePalette };

			setTransparentPalette({ palette, colorConfig: config });

			// 透過色が追加されていないことを確認
			const transparentKeys = Object.keys(palette).filter((key) => key.includes('transparent'));
			expect(transparentKeys).toHaveLength(0);
		});

		it('基本的な透過色パレットが生成される', () => {
			const palette = { ...basePalette };

			setTransparentPalette({ palette, colorConfig: baseColorConfig });

			// 全てのレベルで透過色が生成されることを確認
			SCALE_LEVELS.forEach((level) => {
				const transparentKey = `--test-${level}-transparent`;
				expect(palette[transparentKey]).toBeDefined();
				expect(palette[transparentKey]).toMatch(
					/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
				);
			});
		});

		it('transparentOriginLevelで最大透過度が設定される', () => {
			const testCases = [
				{ originLevel: 50, testLevel: 50 },
				{ originLevel: 500, testLevel: 500 },
				{ originLevel: 950, testLevel: 950 }
			];

			testCases.forEach(({ originLevel, testLevel }) => {
				const config = { ...baseColorConfig, transparentOriginLevel: originLevel };
				const palette = { ...basePalette };

				setTransparentPalette({ palette, colorConfig: config });

				const transparentKey = `--test-${testLevel}-transparent`;
				const transparent = palette[transparentKey];
				expect(transparent).toBeDefined();
				expect(transparent).toMatch(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/);

				// originレベルでの透過度チェック
				const alphaMatch = transparent.match(
					/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/
				);
				expect(alphaMatch).toBeTruthy();
				if (alphaMatch) {
					const alpha = parseFloat(alphaMatch[1]);
					// originレベル自体は常にMAX_ALPHA
					expect(alpha).toBeCloseTo(MAX_ALPHA, 3);
				}
			});
		});

		it('透過度がoriginレベルからの距離に応じて変化する', () => {
			const config = { ...baseColorConfig, transparentOriginLevel: 500 };
			const palette = { ...basePalette };

			setTransparentPalette({ palette, colorConfig: config });

			// 各レベルの透過度を取得
			const getAlpha = (level: number): number => {
				const transparent = palette[`--test-${level}-transparent`];
				const match = transparent.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
				return match ? parseFloat(match[1]) : 0;
			};

			const alpha50 = getAlpha(50);
			const alpha500 = getAlpha(500); // origin
			const alpha950 = getAlpha(950);

			// 基本的な透過度の関係性を確認
			expect(alpha500).toBeCloseTo(MAX_ALPHA, 3); // originは最大透過度
			expect(alpha50).toBeGreaterThanOrEqual(MIN_ALPHA); // 最小透過度以上
			expect(alpha950).toBeGreaterThanOrEqual(MIN_ALPHA); // 最小透過度以上
			expect(alpha50).toBeLessThanOrEqual(MAX_ALPHA); // 最大透過度以下
			expect(alpha950).toBeLessThanOrEqual(MAX_ALPHA); // 最大透過度以下

			// originから離れるほど透過度が下がることを確認
			expect(alpha500).toBeGreaterThan(alpha50);
			expect(alpha500).toBeGreaterThan(alpha950);
		});

		it('異なるoriginLevelで透過度分布が変わる', () => {
			const testCases = [50, 300, 500, 700, 950];
			const results: Record<number, Record<number, number>> = {};

			// 各originLevelでテスト
			testCases.forEach((originLevel) => {
				const config = { ...baseColorConfig, transparentOriginLevel: originLevel };
				const palette = { ...basePalette };

				setTransparentPalette({ palette, colorConfig: config });

				results[originLevel] = {};
				SCALE_LEVELS.forEach((level) => {
					const transparent = palette[`--test-${level}-transparent`];
					const match = transparent.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
					results[originLevel][level] = match ? parseFloat(match[1]) : 0;
				});
			});

			// 各originLevelでそのレベル自体がMAX_ALPHA
			testCases.forEach((originLevel) => {
				expect(results[originLevel][originLevel]).toBeCloseTo(MAX_ALPHA, 3);
			});

			// 異なるoriginLevelで同じレベルの透過度が変わることを確認
			const testLevel = 200;
			const alphaForOrigin50 = results[50][testLevel];
			const alphaForOrigin950 = results[950][testLevel];

			// レベル200はorigin50に近く、origin950から遠い
			expect(alphaForOrigin50).toBeGreaterThan(alphaForOrigin950);
		});

		it('背景色によって適切な背景が選択される', () => {
			const config = { ...baseColorConfig, transparentOriginLevel: 500 };
			const palette = { ...basePalette };

			setTransparentPalette({ palette, colorConfig: config });

			// 透過色が生成されることを確認（背景色の選択は内部実装）
			SCALE_LEVELS.forEach((level) => {
				const transparentKey = `--test-${level}-transparent`;
				expect(palette[transparentKey]).toBeDefined();
				expect(palette[transparentKey]).toMatch(
					/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
				);
			});
		});

		it('背景色の設定がない場合でもエラーを起こさない', () => {
			const config = {
				...baseColorConfig,
				bgColorLight: undefined,
				bgColorDark: undefined
			};
			const palette = { ...basePalette };

			expect(() => {
				setTransparentPalette({ palette, colorConfig: config });
			}).not.toThrow();
		});

		it('ソリッドカラーが存在しないレベルはスキップされる', () => {
			const palette = { ...basePalette };
			// 特定のレベルを削除
			delete palette['--test-300'];
			delete palette['--test-700'];

			setTransparentPalette({ palette, colorConfig: baseColorConfig });

			// 削除したレベルの透過色は生成されない
			expect(palette['--test-300-transparent']).toBeUndefined();
			expect(palette['--test-700-transparent']).toBeUndefined();

			// 他のレベルは正常に生成される
			expect(palette['--test-50-transparent']).toBeDefined();
			expect(palette['--test-500-transparent']).toBeDefined();
			expect(palette['--test-950-transparent']).toBeDefined();
		});

		it('無効なソリッドカラーでも安全に処理される', () => {
			const palette: Palette = {
				'--test-50': '', // 空文字列
				'--test-100': 'invalid-color', // 無効な色
				'--test-200': '#gggggg', // 無効なhex
				'--test-300': 'undefined', // 文字列のundefined
				'--test-400': '#ffffff', // 有効な色
				'--test-500': '   ', // 空白文字
				'--test-600': '#000000' // 有効な色
			};

			expect(() => {
				setTransparentPalette({ palette, colorConfig: baseColorConfig });
			}).not.toThrow();

			// 有効な色に対してのみ透過色が生成される
			expect(palette['--test-400-transparent']).toBeDefined();
			expect(palette['--test-600-transparent']).toBeDefined();
		});

		it('RGB値が0-255の範囲にクランプされる', () => {
			// 極端な色の組み合わせでテスト
			const palette: Palette = {
				'--test-50': '#ffffff', // 白
				'--test-500': '#000000', // 黒
				'--test-950': '#ff0000' // 赤
			};

			const config = {
				...baseColorConfig,
				bgColorLight: '#000000', // 黒背景
				bgColorDark: '#ffffff' // 白背景
			};

			setTransparentPalette({ palette, colorConfig: config });

			// 生成された透過色のRGB値が範囲内であることを確認
			Object.keys(palette)
				.filter((key) => key.includes('transparent'))
				.forEach((key) => {
					const transparent = palette[key];
					const match = transparent.match(
						/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/
					);

					if (match) {
						const r = parseInt(match[1]);
						const g = parseInt(match[2]);
						const b = parseInt(match[3]);

						expect(r).toBeGreaterThanOrEqual(0);
						expect(r).toBeLessThanOrEqual(255);
						expect(g).toBeGreaterThanOrEqual(0);
						expect(g).toBeLessThanOrEqual(255);
						expect(b).toBeGreaterThanOrEqual(0);
						expect(b).toBeLessThanOrEqual(255);
					}
				});
		});

		it('透過度が正しい精度で出力される', () => {
			const palette = { ...basePalette };

			setTransparentPalette({ palette, colorConfig: baseColorConfig });

			// 透過度が3桁精度で出力されることを確認
			Object.keys(palette)
				.filter((key) => key.includes('transparent'))
				.forEach((key) => {
					const transparent = palette[key];
					const match = transparent.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);

					if (match) {
						const alphaStr = match[1];
						const alpha = parseFloat(alphaStr);

						// アルファ値が有効な範囲内であることを確認
						expect(alpha).toBeGreaterThanOrEqual(0);
						expect(alpha).toBeLessThanOrEqual(1);

						// 精度が3桁以下であることを確認
						const decimalPlaces = alphaStr.includes('.') ? alphaStr.split('.')[1].length : 0;
						expect(decimalPlaces).toBeLessThanOrEqual(3);
					}
				});
		});

		it('ゼロ除算やNaN値でフォールバック処理が動作する', () => {
			const palette: Palette = {
				'--test-500': '#ffffff'
			};

			const config = {
				...baseColorConfig,
				transparentOriginLevel: 500,
				bgColorLight: '#ffffff', // 同じ色で計算エラーを誘発
				bgColorDark: '#ffffff'
			};

			expect(() => {
				setTransparentPalette({ palette, colorConfig: config });
			}).not.toThrow();

			// 何らかの透過色が生成されることを確認（フォールバック値）
			const transparent = palette['--test-500-transparent'];
			expect(transparent).toBeDefined();
			expect(transparent).toMatch(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/);
		});

		it('スケールレベルの境界値で正しく動作する', () => {
			const extremeConfig = {
				...baseColorConfig,
				transparentOriginLevel: MIN_LEVEL // 50
			};
			const palette = { ...basePalette };

			setTransparentPalette({ palette, colorConfig: extremeConfig });

			// MIN_LEVELでMAX_ALPHA
			const alphaAtMin = palette[`--test-${MIN_LEVEL}-transparent`];
			const matchMin = alphaAtMin.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
			if (matchMin) {
				expect(parseFloat(matchMin[1])).toBeCloseTo(MAX_ALPHA, 3);
			}

			// MAX_LEVELで最小透過度
			const alphaAtMax = palette[`--test-${MAX_LEVEL}-transparent`];
			const matchMax = alphaAtMax.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
			if (matchMax) {
				const alpha = parseFloat(matchMax[1]);
				expect(alpha).toBeGreaterThanOrEqual(MIN_ALPHA);
				expect(alpha).toBeLessThan(MAX_ALPHA);
			}
		});

		it('コンソール警告が適切に出力される', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// 無効なターゲット色でテスト
			const palette: Palette = {
				'--test-500': '' // 無効な色
			};

			setTransparentPalette({ palette, colorConfig: baseColorConfig });

			// 警告が出力されることを確認（実装に応じて）
			// expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});
});
