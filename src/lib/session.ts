import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth, ensureAuthMigrations } from "@/lib/auth-server";
import { findAppUserById, formatUserDisplay } from "@/db/db";
import type { UserDisplay } from "@/types/user";

export type AuthError = {
  error: string;
  status: number;
};

export async function getSessionUser(): Promise<UserDisplay | null> {
  await ensureAuthMigrations();

  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const user = await findAppUserById(session.user.id);
  return formatUserDisplay(user);
}

export function requireUser(user: UserDisplay | null): AuthError | null {
  if (!user) {
    return { error: "Non authentifié.", status: 401 };
  }
  if (user.archived) {
    return { error: "Compte archivé.", status: 403 };
  }
  return null;
}

export function requireAdmin(user: UserDisplay | null): AuthError | null {
  const authError = requireUser(user);
  if (authError) return authError;
  if (user!.role !== "admin") {
    return { error: "Accès refusé.", status: 403 };
  }
  return null;
}

export function requireClient(user: UserDisplay | null): AuthError | null {
  const authError = requireUser(user);
  if (authError) return authError;
  if (user!.role !== "client") {
    return { error: "Accès refusé.", status: 403 };
  }
  return null;
}

export function authErrorResponse(
  authError: AuthError,
): NextResponse<{ error: string }> {
  return NextResponse.json(
    { error: authError.error },
    { status: authError.status },
  );
}

export type AuthGuardResult =
  | { ok: true; user: UserDisplay }
  | { ok: false; error: AuthError };

export function guardUser(user: UserDisplay | null): AuthGuardResult {
  const authError = requireUser(user);
  if (authError) return { ok: false, error: authError };
  return { ok: true, user: user! };
}

export function guardAdmin(user: UserDisplay | null): AuthGuardResult {
  const authError = requireAdmin(user);
  if (authError) return { ok: false, error: authError };
  return { ok: true, user: user! };
}

export function guardClient(user: UserDisplay | null): AuthGuardResult {
  const authError = requireClient(user);
  if (authError) return { ok: false, error: authError };
  return { ok: true, user: user! };
}
