import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import type { UserId } from "@/types/user";

export async function setUserPassword(
  userId: UserId,
  plainPassword: string,
): Promise<void> {
  const hashed = await hashPassword(plainPassword);
  const now = new Date();

  const existing = await prisma.account.findFirst({
    where: {
      userId: String(userId),
      providerId: "credential",
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: hashed, updatedAt: now },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: String(userId),
      providerId: "credential",
      userId: String(userId),
      password: hashed,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export function generateTempPassword(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
