import { logger } from "@/lib/logger";

const CONTEXT = { module: "whatsapp" };

export function waLog(message: string, data?: unknown): void {
  if (data !== undefined) {
    logger.info(message, { ...CONTEXT, data });
    return;
  }
  logger.info(message, CONTEXT);
}

export function waWarn(message: string, data?: unknown): void {
  if (data !== undefined) {
    logger.warn(message, { ...CONTEXT, data });
    return;
  }
  logger.warn(message, CONTEXT);
}

export function waError(message: string, error?: unknown): void {
  logger.error(message, {
    ...CONTEXT,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
