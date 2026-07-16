import { logger } from "@/lib/logger";

export function logApiError(
  route: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  logger.error("API route error", {
    route,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...extra,
  });
}
