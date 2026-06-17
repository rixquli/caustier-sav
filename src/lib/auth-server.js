import { betterAuth } from "better-auth";
import { db } from "@/db/db";

export const auth = betterAuth({
  database: db,
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
    },
  },
  secret:
    process.env.BETTER_AUTH_SECRET || "caustier-sav-dev-secret-change-in-prod",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

let migrationsDone = false;

export async function ensureAuthMigrations() {
  if (migrationsDone) return;
  try {
    // const { getMigrations } = await import("better-auth/db");
    // const { runMigrations } = await getMigrations(auth.options);
    // await runMigrations();
    migrationsDone = true;
    await seedDefaultUsers();
  } catch (err) {
    console.error("Auth migration error:", err);
  }
}

async function seedDefaultUsers() {
  const admin = db
    .prepare("SELECT id FROM user WHERE email = ?")
    .get("admin@caustier.fr");
  if (!admin) {
    await auth.api.signUpEmail({
      body: {
        email: "admin@caustier.fr",
        password: "admin123",
        name: "Admin Caustier",
      },
    });
    db.prepare(
      "UPDATE user SET role = 'admin', nom = 'Caustier', prenom = 'Admin' WHERE email = ?",
    ).run("admin@caustier.fr");
  }

  const client = db
    .prepare("SELECT id FROM user WHERE email = ?")
    .get("client@caustier.fr");
  if (!client) {
    await auth.api.signUpEmail({
      body: {
        email: "client@caustier.fr",
        password: "client123",
        name: "Demo Client",
      },
    });
    db.prepare(
      "UPDATE user SET role = 'client', nom = 'Demo', prenom = 'Client' WHERE email = ?",
    ).run("client@caustier.fr");
  }
}
