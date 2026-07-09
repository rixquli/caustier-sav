import type { NextRequest } from "next/server";
import { getAuth, ensureAuthMigrations } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

type AuthHandler = ReturnType<typeof toNextJsHandler>;

let handler: AuthHandler | undefined;

function getHandler(): AuthHandler {
  if (!handler) {
    handler = toNextJsHandler(getAuth());
  }
  return handler;
}

export async function GET(request: NextRequest) {
  await ensureAuthMigrations();
  return getHandler().GET(request);
}

export async function POST(request: NextRequest) {
  await ensureAuthMigrations();
  return getHandler().POST(request);
}
