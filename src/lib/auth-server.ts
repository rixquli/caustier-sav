import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { seedFaqIfEmpty } from "@/db/db";
import { setUserPassword } from "@/lib/password-utils";
import type { UserRole } from "@/types/user";

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
    secret:
      process.env.BETTER_AUTH_SECRET ||
      "caustier-sav-dev-secret-change-in-prod",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
    console.error("Auth migration error:", err);
  }
}

type SeedUserFields = {
  role: UserRole;
  nom: string;
  prenom: string;
  mustChangePassword: number;
  archived: number;
};

async function seedDefaultUsers(): Promise<void> {
  await seedDefaultUser({
    email: "admin@caustier.fr",
    password: "admin123",
    name: "Admin Caustier",
    fields: {
      role: "admin",
      nom: "Caustier",
      prenom: "Admin",
      mustChangePassword: 0,
      archived: 0,
    },
  });

  await seedDefaultUser({
    email: "client@caustier.fr",
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

  await seedDefaultUser({
    email: "assistant-ia@internal.caustier",
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
