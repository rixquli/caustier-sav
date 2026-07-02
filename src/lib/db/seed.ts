import { randomUUID } from "crypto";
import { auth } from "../auth";
import { db } from "./db";

async function createUser() {
  const accountId = randomUUID();
  const now = new Date().toISOString();

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash("monMotDePasse123");

  db.prepare(
    `
    INSERT INTO user (email, password, name, adresse, telephone, ville, pays, code_postal, note, is_admin, emailVerified, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    "admin@example.com",
    passwordHash,
    "John Doe",
    "12 rue de la Paix",
    "0612345678",
    "Paris",
    "France",
    "75001",
    null,
    1,
    0, // emailVerified = false
    now,
    now,
  );

  const user = db
    .prepare(`SELECT id FROM user WHERE email = ?`)
    .get("admin@example.com") as { id: string }; // corrigé : même email qu'à l'insert

  db.prepare(
    `
    INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    accountId,
    user.id.toString(),
    "credential",
    user.id.toString(),
    passwordHash,
    now,
    now,
  );

  console.log("✅ Utilisateur créé :", user.id);
  db.close();
}

createUser();
