// transparentColor.ts

import type { Palette, ColorConfig } from "./types";
import { hexToRGB } from "./colorUtils";
import { createContextLogger } from "./logger";
import {
  SCALE_LEVELS,
  MAX_LEVEL,
  MIN_LEVEL,
  MAX_ALPHA,
  MIN_ALPHA,
} from "./constants";

const log = createContextLogger("TransparentColor");

// =============================================================================
// 透過色パレット生成
// =============================================================================

/**
 * 透過色パレットを生成
 */
export const setTransparentPalette = ({
  colorConfig,
  palette,
}: {
  colorConfig: ColorConfig;
  palette: Palette;
}): void => {
  if (!colorConfig.transparentOriginLevel) return;

  SCALE_LEVELS.forEach((level) => {
    const transparentOriginLevel = colorConfig.transparentOriginLevel as number;
    const targetSolidColor = palette[`--${colorConfig.prefix}-${level}`];

    if (!targetSolidColor) return;

    // 入力値の正規化と検証
    const normalizedColor = targetSolidColor.trim();
    if (
      !normalizedColor ||
      normalizedColor === "" ||
      normalizedColor === "undefined"
    ) {
      log.warn(`Invalid target solid color for level ${level}`, {
        targetSolidColor,
      });
      return;
    }

    // 透過度を計算
    const fixedAlpha = getAlphaForLevel({
      level,
      transparentOriginLevel: transparentOriginLevel,
    });

    // 背景色を決定（originレベル以下は明るい背景、それ以上は暗い背景）
    const backgroundColor =
      level <= transparentOriginLevel
        ? colorConfig.bgColorLight
        : colorConfig.bgColorDark;

    if (!backgroundColor) return;

    // 透過色を計算
    const transparentColor = calculateTransparentColor({
      targetSolidColor: normalizedColor,
      backgroundColor,
      fixedAlpha,
    });

    palette[`--${colorConfig.prefix}-${level}-transparent`] = transparentColor;
  });
};

// =============================================================================
// 透過度計算
// =============================================================================

/**
 * レベルに基づいて透過度を計算
 */
const getAlphaForLevel = ({
  level,
  transparentOriginLevel,
}: {
  level: number;
  transparentOriginLevel: number;
}): number => {
  // originLevel自体は常にMAX_ALPHA
  if (level === transparentOriginLevel) {
    return MAX_ALPHA;
  }

  const alphaDifference = MAX_ALPHA - MIN_ALPHA; // 0.9
  const STEP_SIZE = 50;

  if (level < transparentOriginLevel) {
    // 明るい方向（50からtransparentOriginLevelまで）
    const totalSteps = (transparentOriginLevel - MIN_LEVEL) / STEP_SIZE;

    if (totalSteps === 0) {
      return MIN_ALPHA;
    }

    const currentStep = (level - MIN_LEVEL) / STEP_SIZE;
    const stepAlpha = alphaDifference / totalSteps;

    return MIN_ALPHA + stepAlpha * currentStep;
  } else {
    // 暗い方向（transparentOriginLevelから950まで）
    const totalSteps = (MAX_LEVEL - transparentOriginLevel) / STEP_SIZE;

    if (totalSteps === 0) {
      return MIN_ALPHA;
    }

    const currentStep = (level - transparentOriginLevel) / STEP_SIZE;
    const stepAlpha = alphaDifference / totalSteps;

    return MAX_ALPHA - stepAlpha * currentStep;
  }
};

// =============================================================================
// 透過色計算
// =============================================================================

/**
 * 固定透過度から透過色を逆算
 */
const calculateTransparentColor = ({
  targetSolidColor,
  backgroundColor,
  fixedAlpha,
}: {
  targetSolidColor: string;
  backgroundColor: string;
  fixedAlpha: number;
}): string => {
  // RGB変換とエラーハンドリング
  let target: { r: number; g: number; b: number };
  let bg: { r: number; g: number; b: number };

  try {
    target = hexToRGB(targetSolidColor);

    if (isNaN(target.r) || isNaN(target.g) || isNaN(target.b)) {
      log.error(`Invalid RGB from target color`, { targetSolidColor, target });
      return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
    }
  } catch (error) {
    log.error(`Error converting target color`, { targetSolidColor, error });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  try {
    bg = hexToRGB(backgroundColor);

    if (isNaN(bg.r) || isNaN(bg.g) || isNaN(bg.b)) {
      log.error(`Invalid RGB from background color`, { backgroundColor, bg });
      return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
    }
  } catch (error) {
    log.error(`Error converting background color`, { backgroundColor, error });
    return `rgba(0, 0, 0, ${fixedAlpha.toFixed(3)})`;
  }

  // ゼロ除算の防止
  if (fixedAlpha === 0) {
    log.warn("Alpha is 0, returning background color");
    return `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.000)`;
  }

  // 透過色のRGB値を逆算
  const backgroundMultiplier = 1 - fixedAlpha;
  const transparentR = (target.r - bg.r * backgroundMultiplier) / fixedAlpha;
  const transparentG = (target.g - bg.g * backgroundMultiplier) / fixedAlpha;
  const transparentB = (target.b - bg.b * backgroundMultiplier) / fixedAlpha;

  // 0-255の範囲にクランプ
  const clampedR = clampRGBValue(transparentR);
  const clampedG = clampRGBValue(transparentG);
  const clampedB = clampRGBValue(transparentB);

  return `rgba(${clampedR}, ${clampedG}, ${clampedB}, ${fixedAlpha.toFixed(
    3
  )})`;
};

/**
 * RGB値を0-255の範囲にクランプ
 */
const clampRGBValue = (value: number): number => {
  return Math.max(0, Math.min(255, Math.round(value)));
};
