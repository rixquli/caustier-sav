import { auth, ensureAuthMigrations } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export async function GET(request) {
  await ensureAuthMigrations();
  return handler.GET(request);
}

export async function POST(request) {
  await ensureAuthMigrations();
  return handler.POST(request);
}
