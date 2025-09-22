// colorUtils.ts
import * as culori from "culori";
import { type Oklch } from "culori";

export type Rgb = { r: number; g: number; b: number };

/**
 * OKLCH を RGB(0..255) に変換（彩度保持重視のガマットマッピング）
 *
 * 戦略:
 * 1. まず元の色がRGB範囲内かチェック
 * 2. 範囲外なら明度を少し調整して彩度を最大限保持
 * 3. 最終手段でclampChromaを使用
 */
export const fitOklchToRgb = (src: Oklch): Rgb => {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // 安全な入力値に正規化
  const normalized: Oklch = {
    mode: "oklch",
    l: clamp01(src.l || 0),
    c: Math.max(0, src.c || 0),
    h: src.h,
  };

  // 1. 元の色がRGB範囲内かチェック
  const rgbTest = culori.rgb(normalized) as any;
  if (
    rgbTest &&
    rgbTest.r >= 0 &&
    rgbTest.r <= 1 &&
    rgbTest.g >= 0 &&
    rgbTest.g <= 1 &&
    rgbTest.b >= 0 &&
    rgbTest.b <= 1
  ) {
    return {
      r: Math.round(rgbTest.r * 255),
      g: Math.round(rgbTest.g * 255),
      b: Math.round(rgbTest.b * 255),
    };
  }

  // 2. 明度調整で彩度保持を試行（±0.25範囲、より積極的）
  const lightnessCandidates = [
    0, -0.02, 0.02, -0.05, 0.05, -0.08, 0.08, -0.12, 0.12, -0.16, 0.16, -0.2,
    0.2, -0.25, 0.25,
  ];
  let bestCandidate: Oklch | null = null;
  let bestChroma = -1;

  for (const deltaL of lightnessCandidates) {
    const candidate: Oklch = {
      mode: "oklch",
      l: clamp01(normalized.l + deltaL),
      c: normalized.c,
      h: normalized.h,
    };

    const testRgb = culori.rgb(candidate) as any;
    if (
      testRgb &&
      testRgb.r >= 0 &&
      testRgb.r <= 1 &&
      testRgb.g >= 0 &&
      testRgb.g <= 1 &&
      testRgb.b >= 0 &&
      testRgb.b <= 1
    ) {
      if (candidate.c > bestChroma) {
        bestChroma = candidate.c;
        bestCandidate = candidate;
      }
    }
  }

  if (bestCandidate) {
    const rgb = culori.rgb(bestCandidate) as any;
    return {
      r: Math.round(rgb.r * 255),
      g: Math.round(rgb.g * 255),
      b: Math.round(rgb.b * 255),
    };
  }

  // 3. 彩度を段階的に下げながら最大保持を試行
  const chromaSteps = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
  for (const chromaRatio of chromaSteps) {
    const reducedChroma: Oklch = {
      mode: "oklch",
      l: normalized.l,
      c: normalized.c * chromaRatio,
      h: normalized.h,
    };

    const testRgb = culori.rgb(reducedChroma) as any;
    if (
      testRgb &&
      testRgb.r >= 0 &&
      testRgb.r <= 1 &&
      testRgb.g >= 0 &&
      testRgb.g <= 1 &&
      testRgb.b >= 0 &&
      testRgb.b <= 1
    ) {
      return {
        r: Math.round(testRgb.r * 255),
        g: Math.round(testRgb.g * 255),
        b: Math.round(testRgb.b * 255),
      };
    }
  }

  // 4. 最終手段: clampChromaで彩度を下げる
  const fallback = culori.clampChroma(normalized, "oklch", "rgb");
  const rgb = culori.rgb(fallback) as any;
  return {
    r: Math.round((rgb?.r || 0) * 255),
    g: Math.round((rgb?.g || 0) * 255),
    b: Math.round((rgb?.b || 0) * 255),
  };
};
