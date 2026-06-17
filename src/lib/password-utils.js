import { hashPassword } from "better-auth/crypto";
import { db } from "@/db/db";

export async function setUserPassword(userId, plainPassword) {
  const hashed = await hashPassword(plainPassword);
  db.prepare(
    "UPDATE account SET password = ? WHERE userId = ? AND providerId = 'credential'",
  ).run(hashed, userId);
}

export function generateTempPassword(length = 10) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
