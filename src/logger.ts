// logger.ts
// Unified log utility - provides consistency for error handling

/**
 * Log level
 */
type LogLevel = "warn" | "error" | "info";

/**
 * Output log message
 */
const outputLog = (
  level: LogLevel,
  context: string,
  message: string,
  data?: any
): void => {
  // Output nothing in production environment
  if (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV === "production"
  ) {
    return;
  }

  // Production detection in browser environment (common bundler configuration)
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
 * Unified log interface
 */
export const logger = {
  /**
   * Output warning log
   */
  warn: (context: string, message: string, data?: any): void => {
    outputLog("warn", context, message, data);
  },

  /**
   * Output error log
   */
  error: (context: string, message: string, data?: any): void => {
    outputLog("error", context, message, data);
  },

  /**
   * Output info log
   */
  info: (context: string, message: string, data?: any): void => {
    outputLog("info", context, message, data);
  },
};

/**
 * Helper for detailed logging in development environment
 */
export const createContextLogger = (context: string) => ({
  warn: (message: string, data?: any) => logger.warn(context, message, data),
  error: (message: string, data?: any) => logger.error(context, message, data),
  info: (message: string, data?: any) => logger.info(context, message, data),
});
