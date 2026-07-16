import { logger } from "@/lib/logger";

export function setupProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", {
      error: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", {
      error: error.message,
      stack: error.stack,
    });
  });
}
