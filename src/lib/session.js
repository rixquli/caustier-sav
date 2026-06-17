import { headers } from "next/headers";
import { auth, ensureAuthMigrations } from "@/lib/auth-server";
import { findAppUserById, formatUserDisplay } from "@/db/db";

export async function getSessionUser() {
  await ensureAuthMigrations();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const user = findAppUserById(session.user.id);
  return formatUserDisplay(user);
}

export function requireUser(user) {
  if (!user) {
    return { error: "Non authentifié.", status: 401 };
  }
  if (user.archived) {
    return { error: "Compte archivé.", status: 403 };
  }
  return null;
}

export function requireAdmin(user) {
  const authError = requireUser(user);
  if (authError) return authError;
  if (user.role !== "admin") {
    return { error: "Accès refusé.", status: 403 };
  }
  return null;
}

export function requireClient(user) {
  const authError = requireUser(user);
  if (authError) return authError;
  if (user.role !== "client") {
    return { error: "Accès refusé.", status: 403 };
  }
  return null;
}
