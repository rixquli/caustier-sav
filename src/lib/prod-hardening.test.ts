import { describe, expect, it, vi } from "vitest";
import { isPublicApiRoute } from "@/lib/api-public-paths";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "@/lib/pagination";
import { verifyWhatsappSignature } from "@/lib/whatsapp/verify";
import { buildHealthResponse, checkDatabaseHealth } from "@/lib/health";
import { Prisma } from "@/generated/prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    whatsappProcessedEvent: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  claimWhatsappEvent,
  releaseWhatsappEvent,
} from "@/db/whatsapp-events";

const mockedCreate = vi.mocked(prisma.whatsappProcessedEvent.create);
const mockedDeleteMany = vi.mocked(prisma.whatsappProcessedEvent.deleteMany);
const mockedQueryRaw = vi.mocked(prisma.$queryRaw);

describe("isPublicApiRoute", () => {
  it("autorise auth, webhook, /api/me et /api/health", () => {
    expect(isPublicApiRoute("/api/auth/sign-in")).toBe(true);
    expect(isPublicApiRoute("/api/whatsapp/webhook")).toBe(true);
    expect(isPublicApiRoute("/api/me")).toBe(true);
    expect(isPublicApiRoute("/api/health")).toBe(true);
  });

  it("refuse les routes métier", () => {
    expect(isPublicApiRoute("/api/demandes")).toBe(false);
    expect(isPublicApiRoute("/api/clients")).toBe(false);
  });
});

describe("parsePaginationQuery", () => {
  it("retourne null sans paramètres (rétrocompatibilité)", () => {
    expect(parsePaginationQuery(null, null)).toBeNull();
  });

  it("parse page et limit", () => {
    const result = parsePaginationQuery("2", "25");
    expect(result).toEqual({ page: 2, limit: 25, skip: 25 });
  });

  it("plafonne limit à 200", () => {
    const result = parsePaginationQuery("1", "999");
    expect(result?.limit).toBe(200);
  });
});

describe("buildPaginationMeta", () => {
  it("calcule totalPages", () => {
    expect(buildPaginationMeta(1, 50, 120)).toEqual({
      page: 1,
      limit: 50,
      total: 120,
      totalPages: 3,
    });
  });
});

describe("verifyWhatsappSignature", () => {
  it("accepte sans secret hors production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WHATSAPP_APP_SECRET", "");

    expect(verifyWhatsappSignature("{}", null)).toBe(true);

    vi.unstubAllEnvs();
  });

  it("refuse sans secret en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WHATSAPP_APP_SECRET", "");

    expect(verifyWhatsappSignature("{}", null)).toBe(false);

    vi.unstubAllEnvs();
  });
});

describe("claimWhatsappEvent", () => {
  it("réserve un nouvel événement", async () => {
    mockedCreate.mockResolvedValueOnce({ id: "wamid.1", created_at: new Date() });

    await expect(claimWhatsappEvent("wamid.1")).resolves.toBe(true);
    expect(mockedCreate).toHaveBeenCalledWith({ data: { id: "wamid.1" } });
  });

  it("refuse un doublon concurrent", async () => {
    mockedCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(claimWhatsappEvent("wamid.1")).resolves.toBe(false);
  });
});

describe("releaseWhatsappEvent", () => {
  it("supprime la réservation pour permettre un retry", async () => {
    mockedDeleteMany.mockResolvedValueOnce({ count: 1 });

    await releaseWhatsappEvent("wamid.1");

    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { id: "wamid.1" },
    });
  });
});

describe("checkDatabaseHealth", () => {
  it("retourne ok quand la base répond", async () => {
    mockedQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    await expect(checkDatabaseHealth()).resolves.toBe("ok");
  });

  it("retourne error quand la base est inaccessible", async () => {
    mockedQueryRaw.mockRejectedValueOnce(new Error("connection refused"));

    await expect(checkDatabaseHealth()).resolves.toBe("error");
  });
});

describe("buildHealthResponse", () => {
  it("retourne ok quand la base est saine", () => {
    expect(buildHealthResponse("ok", "0.1.0")).toMatchObject({
      status: "ok",
      db: "ok",
      version: "0.1.0",
    });
  });

  it("retourne degraded quand la base est en erreur", () => {
    expect(buildHealthResponse("error", "0.1.0")).toMatchObject({
      status: "degraded",
      db: "error",
      version: "0.1.0",
    });
  });
});
