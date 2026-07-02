import { randomUUID } from "crypto";
import { auth } from "../auth";
import { queryOne, query } from "./db";

async function createUser() {
  const accountId = randomUUID();
  const now = new Date().toISOString();

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash("monMotDePasse123");

  await query(
    `
    INSERT INTO "user" (email, password, name, adresse, telephone, ville, pays, code_postal, note, is_admin, emailVerified, createdAt, updatedAt)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `,
    [
      "admin@example.com",
      passwordHash,
      "John Doe",
      "12 rue de la Paix",
      "0612345678",
      "Paris",
      "France",
      "75001",
      null,
      true,
      false,
      now,
      now,
    ],
  );

  const user = (await queryOne<{ id: number }>(
    `SELECT id FROM "user" WHERE email = $1`,
    ["admin@example.com"],
  )) as { id: number };

  await query(
    `
    INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    [
      accountId,
      user.id.toString(),
      "credential",
      user.id.toString(),
      passwordHash,
      now,
      now,
    ],
  );

  console.log("✅ Utilisateur créé :", user.id);
}

createUser();
