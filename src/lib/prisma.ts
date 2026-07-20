import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Neon / Vercel injectent DATABASE_* ou les alias legacy POSTGRES_*. */
function getDatabaseUrl(): string {
  const url =
    process.env.DIRECT_DATABASE_URL ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL;

  if (url) return url;

  // `next build` importe les routes API pour collecter les page data :
  // pas besoin d'une vraie DB à ce stade (même approche que le Dockerfile).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://build:build@127.0.0.1:5432/build";
  }

  throw new Error(
    "Database URL is not set (expected DIRECT_DATABASE_URL, DATABASE_URL_UNPOOLED, DATABASE_URL, or POSTGRES_URL*)",
  );
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy init : évite de créer le client (et d'exiger une URL DB)
 * au simple import pendant `next build`.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
