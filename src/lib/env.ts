export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Variable d'environnement obligatoire manquante : ${name}`);
  }
  return value.trim();
}

export function getAuthSecret(): string {
  if (isProduction()) {
    return requireEnv("BETTER_AUTH_SECRET");
  }
  return (
    process.env.BETTER_AUTH_SECRET || "caustier-sav-dev-secret-change-in-prod"
  );
}

export function getAuthBaseUrl(): string {
  if (isProduction()) {
    return requireEnv("BETTER_AUTH_URL");
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

/** Comptes démo (admin123 / client123) — uniquement hors production. */
export function shouldSeedDemoUsers(): boolean {
  return !isProduction();
}
