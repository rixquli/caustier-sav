export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { setupProcessErrorHandlers } = await import("@/lib/process-error-handlers");
  setupProcessErrorHandlers();

  const { ensureAuthMigrations } = await import("@/lib/auth-server");
  await ensureAuthMigrations();
}
