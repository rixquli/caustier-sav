import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { auth } from "../auth";
import { db } from "./db";

export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  adresse: string;
};

async function createUser() {
  const now = new Date().toISOString();
  const accountId = randomUUID();

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash("monMotDePasse123");

  db.prepare(
    `
    INSERT INTO user (email, password, name, adresse, telephone, ville, pays, code_postal, note, is_admin, emailVerified, image, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    "client@example.com",
    passwordHash,
    "John Doe",
    "12 rue de la Paix",
    "0612345678",
    "Paris",
    "France",
    "75001",
    null,
    0,
    1,
    null,
    now,
    now,
  );

  const user = db
    .prepare(`SELECT id FROM user WHERE email = ?`)
    .get("admin@example.com") as { id: string };

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
