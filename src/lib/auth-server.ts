import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { seedFaqIfEmpty } from "@/db/db";
import {
  getAuthBaseUrl,
  getAuthSecret,
  shouldSeedDemoUsers,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { setUserPassword } from "@/lib/password-utils";
import type { UserRole } from "@/types/user";

const ASSISTANT_IA_EMAIL = "assistant-ia@internal.caustier";
const DEFAULT_ADMIN_EMAIL = "admin@caustier.fr";
const DEFAULT_CLIENT_EMAIL = "client@caustier.fr";

function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "client",
          input: false,
        },
        nom: { type: "string", required: false },
        prenom: { type: "string", required: false },
        phone: { type: "string", required: false },
        adresse: { type: "string", required: false },
        archived: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
        mustChangePassword: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
        notes_admin: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    secret: getAuthSecret(),
    baseURL: getAuthBaseUrl(),
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    const instance = getAuth();
    const value = instance[prop as keyof AuthInstance];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});

let migrationsDone = false;

export async function ensureAuthMigrations(): Promise<void> {
  if (migrationsDone) return;
  try {
    await seedDefaultUsers();
    await seedFaqIfEmpty();
    migrationsDone = true;
  } catch (err) {
    logger.error("Auth bootstrap error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

async function countHumanAdmins(): Promise<number> {
  return prisma.user.count({
    where: {
      role: "admin",
      email: { not: ASSISTANT_IA_EMAIL },
    },
  });
}

async function seedDefaultUsers(): Promise<void> {
  const bootstrapAdmin = (await countHumanAdmins()) === 0;
  const seedDemo = shouldSeedDemoUsers();

  if (seedDemo || bootstrapAdmin) {
    if (bootstrapAdmin) {
      logger.info("Bootstrap admin account", { email: DEFAULT_ADMIN_EMAIL });
    }

    await seedDefaultUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: "admin123",
      name: "Admin Caustier",
      fields: {
        role: "admin",
        nom: "Caustier",
        prenom: "Admin",
        mustChangePassword: bootstrapAdmin && !seedDemo ? 1 : 0,
        archived: 0,
      },
    });
  }

  if (seedDemo) {
    await seedDefaultUser({
      email: DEFAULT_CLIENT_EMAIL,
      password: "client123",
      name: "Demo Client",
      fields: {
        role: "client",
        nom: "Demo",
        prenom: "Client",
        mustChangePassword: 0,
        archived: 0,
      },
    });
  }

  await seedDefaultUser({
    email: ASSISTANT_IA_EMAIL,
    password: "assistant-ia-no-login",
    name: "Assistant IA",
    fields: {
      role: "admin",
      nom: "IA",
      prenom: "Assistant",
      mustChangePassword: 0,
      archived: 0,
    },
  });
}

type SeedUserFields = {
  role: UserRole;
  nom: string;
  prenom: string;
  mustChangePassword: number;
  archived: number;
};

async function seedDefaultUser({
  email,
  password,
  name,
  fields,
}: {
  email: string;
  password: string;
  name: string;
  fields: SeedUserFields;
}): Promise<void> {
  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    await getAuth().api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  if (!user) return;

  await prisma.user.update({
    where: { email },
    data: {
      role: fields.role,
      nom: fields.nom,
      prenom: fields.prenom,
      mustChangePassword: Boolean(fields.mustChangePassword),
      archived: Boolean(fields.archived),
      name,
    },
  });

  await setUserPassword(user.id, password);
}
