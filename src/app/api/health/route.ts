import { NextResponse } from "next/server";
import packageJson from "../../../../package.json" with { type: "json" };
import { buildHealthResponse, checkDatabaseHealth } from "@/lib/health";
import type { HealthResponse } from "@/lib/health";

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const db = await checkDatabaseHealth();
  const body = buildHealthResponse(db, packageJson.version);

  return NextResponse.json(body, {
    status: db === "ok" ? 200 : 503,
  });
}
