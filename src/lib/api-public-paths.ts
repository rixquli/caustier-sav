/** Routes API accessibles sans session (webhook Meta, auth Better Auth, sonde session). */
export const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/whatsapp/webhook",
  "/api/me",
] as const;

export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
