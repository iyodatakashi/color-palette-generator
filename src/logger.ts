// logger.ts
// 統一ログユーティリティ - エラーハンドリングの一貫性を提供

/**
 * ログレベル
 */
type LogLevel = "warn" | "error" | "info";

/**
 * ログメッセージの出力
 */
const outputLog = (
  level: LogLevel,
  context: string,
  message: string,
  data?: any
): void => {
  // 本番環境では何も出力しない
  if (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV === "production"
  ) {
    return;
  }

  // ブラウザ環境での本番判定（一般的なバンドラー設定）
  if (typeof window !== "undefined" && (window as any).__PRODUCTION__) {
    return;
  }

  const prefix = `[ColorPalette:${context}]`;
  const logMessage = `${prefix} ${message}`;

  switch (level) {
    case "error":
      if (data !== undefined) {
        console.error(logMessage, data);
      } else {
        console.error(logMessage);
      }
      break;
    case "warn":
      if (data !== undefined) {
        console.warn(logMessage, data);
      } else {
        console.warn(logMessage);
      }
      break;
    case "info":
      if (data !== undefined) {
        console.info(logMessage, data);
      } else {
        console.info(logMessage);
      }
      break;
  }
};

/**
 * 統一ログインターフェース
 */
export const logger = {
  /**
   * 警告ログを出力
   */
  warn: (context: string, message: string, data?: any): void => {
    outputLog("warn", context, message, data);
  },

  /**
   * エラーログを出力
   */
  error: (context: string, message: string, data?: any): void => {
    outputLog("error", context, message, data);
  },

  /**
   * 情報ログを出力
   */
  info: (context: string, message: string, data?: any): void => {
    outputLog("info", context, message, data);
  },
};

/**
 * 開発環境での詳細ログ用ヘルパー
 */
export const createContextLogger = (context: string) => ({
  warn: (message: string, data?: any) => logger.warn(context, message, data),
  error: (message: string, data?: any) => logger.error(context, message, data),
  info: (message: string, data?: any) => logger.info(context, message, data),
});
