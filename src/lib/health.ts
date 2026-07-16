import { prisma } from "@/lib/prisma";
import { logApiError } from "@/lib/log-api-error";

export type HealthStatus = "ok" | "degraded";
export type DbHealthStatus = "ok" | "error";

export type HealthResponse = {
  status: HealthStatus;
  db: DbHealthStatus;
  timestamp: string;
  version: string;
};

export async function checkDatabaseHealth(): Promise<DbHealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch (error) {
    logApiError("/api/health", error, { component: "database" });
    return "error";
  }
}

export function buildHealthResponse(
  db: DbHealthStatus,
  version: string,
): HealthResponse {
  return {
    status: db === "ok" ? "ok" : "degraded",
    db,
    timestamp: new Date().toISOString(),
    version,
  };
}
