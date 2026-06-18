import { betterAuth } from "better-auth";
import { getDb, ensureExtraColumns, seedFaqIfEmpty } from "@/db/db";
import { setUserPassword } from "@/lib/password-utils";

let authInstance = null;

function createAuth() {
  return betterAuth({
    database: getDb(),
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

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

export const auth = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getAuth();
      const value = instance[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  },
);

let migrationsDone = false;

export async function ensureAuthMigrations() {
  if (migrationsDone) return;
  try {
    const ctx = await getAuth().$context;
    await ctx.runMigrations();
    ensureExtraColumns();
    await seedDefaultUsers();
    seedFaqIfEmpty();
    migrationsDone = true;
  } catch (err) {
    console.error("Auth migration error:", err);
  }
}

async function seedDefaultUsers() {
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
}

async function seedDefaultUser({ email, password, name, fields }) {
  const database = getDb();
  let user = database.prepare("SELECT id FROM user WHERE email = ?").get(email);

  if (!user) {
    await getAuth().api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    user = database.prepare("SELECT id FROM user WHERE email = ?").get(email);
  }

  if (!user) return;

  database.prepare(
    `UPDATE user
     SET role = ?, nom = ?, prenom = ?, mustChangePassword = ?, archived = ?, name = ?
     WHERE email = ?`,
  ).run(
    fields.role,
    fields.nom,
    fields.prenom,
    fields.mustChangePassword,
    fields.archived,
    name,
    email,
  );

  await setUserPassword(user.id, password);
}
