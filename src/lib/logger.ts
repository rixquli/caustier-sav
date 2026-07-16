type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SERVICE_NAME = "caustier-sav";

function getMinLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL;
  if (
    configured === "debug" ||
    configured === "info" ||
    configured === "warn" ||
    configured === "error"
  ) {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[getMinLevel()];
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    message,
    ...context,
  };

  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    writeLog("debug", message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    writeLog("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    writeLog("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    writeLog("error", message, context);
  },
};
