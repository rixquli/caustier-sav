import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db/db";

export async function setUserPassword(userId, plainPassword) {
  const hashed = await hashPassword(plainPassword);
  const now = new Date().toISOString();
  const existing = db
    .prepare(
      "SELECT id FROM account WHERE userId = ? AND providerId = 'credential' LIMIT 1",
    )
    .get(userId);

  if (existing) {
    db.prepare("UPDATE account SET password = ?, updatedAt = ? WHERE id = ?").run(
      hashed,
      now,
      existing.id,
    );
    return;
  }

  const columns = db.prepare("PRAGMA table_info(account)").all();
  if (columns.length === 0) {
    throw new Error("Better Auth account table is missing.");
  }

  const account = {
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashed,
    createdAt: now,
    updatedAt: now,
  };
  const insertColumns = columns
    .map((column) => column.name)
    .filter((name) => account[name] !== undefined);
  const placeholders = insertColumns.map(() => "?").join(", ");

  db.prepare(
    `INSERT INTO account (${insertColumns.join(", ")}) VALUES (${placeholders})`,
  ).run(...insertColumns.map((name) => account[name]));
}

export function generateTempPassword(length = 10) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
