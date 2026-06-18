import { getAuth, ensureAuthMigrations } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

let handler;

function getHandler() {
  if (!handler) {
    handler = toNextJsHandler(getAuth());
  }
  return handler;
}

export async function GET(request) {
  await ensureAuthMigrations();
  return getHandler().GET(request);
}

export async function POST(request) {
  await ensureAuthMigrations();
  return getHandler().POST(request);
}
