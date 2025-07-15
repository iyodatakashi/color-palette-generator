// types.ts

// =============================================================================
// カラーパレット生成ライブラリ - 型定義
// =============================================================================

// =============================================================================
// ライブラリの基本的なインターフェース
// =============================================================================

/**
 * カラーパレットの型定義（出力）
 */
/**
 * 色設定の型定義（入力）
 */
export type ColorConfig = {
	id: string;
	prefix: string;
	color: string;
	hueShiftMode?: HueShiftMode;
	lightnessMethod?: LightnessMethod;
	includeTransparent?: boolean;
	bgColorLight?: string;
	bgColorDark?: string;
	transparentOriginLevel?: number;
};

export type Palette = {
	[key: string]: string;
};

// =============================================================================
// 色空間の型定義
// =============================================================================

/**
 * RGB色の型定義
 */
export type RGB = {
	r: number;
	g: number;
	b: number;
};

/**
 * HSL色の型定義
 */
export type HSL = {
	h: number;
	s: number;
	l: number;
};

// =============================================================================
// 明度計算関連の型定義
// =============================================================================

/**
 * 明度計算方法の型定義
 */
export type LightnessMethod =
	| 'hybrid' // バランス明度（推奨）
	| 'hsl' // HSL明度（統一重視）
	| 'perceptual' // 知覚的明度（正確性重視）
	| 'average'; // RGB平均明度（シンプル）

// =============================================================================
// 色相変化関連の型定義
// =============================================================================

/**
 * 色相変化モードの型定義
 */
export type HueShiftMode = 'fixed' | 'natural' | 'unnatural';

// types.ts に追加

// =============================================================================
// カラーコンビネーション関連の型定義
// =============================================================================

/**
 * カラー組み合わせの種類
 */
export type CombinationType =
	| 'monochromatic'
	| 'analogous'
	| 'complementary'
	| 'splitComplementary'
	| 'doubleComplementary'
	| 'doubleComplementaryReverse'
	| 'triadic'
	| 'tetradic';

/**
 * ベースカラーの戦略
 */
export type BaseColorStrategy = 'harmonic' | 'contrasting' | 'neutral';

/**
 * カラーサジェスト設定
 */
export type CombinationConfig = {
	primaryColor: string;
	combinationType?: CombinationType;
	lightnessMethod?: LightnessMethod;
	baseColorStrategy?: BaseColorStrategy;
};

/**
 * サジェスト結果（ColorConfig配列）
 */
export type Combination = ColorConfig[];

// =============================================================================
// ランダムカラー生成関連の型定義
// =============================================================================

/**
 * ランダムプライマリーカラー生成の設定オプション
 */
export type RandomColorConfig = {
	/** 彩度の範囲 [min, max] (0-100) */
	saturationRange?: [number, number];
	/** 目標明度 (0-100) */
	lightnessRange?: [number, number];
	/** 明度計算方法 */
	lightnessMethod?: LightnessMethod;
	/** 色相の制限範囲 [min, max] (0-360) */
	hueRange?: [number, number];
};

/**
 * 生成されたカラー情報
 */
export type GeneratedColor = {
	hsl: HSL;
	rgb: RGB;
	hex: string;
	actualLightness: number;
};
