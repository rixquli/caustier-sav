import { prisma } from "@/lib/prisma";
import { toIsoString } from "./helpers";
import type {
  CreatePushSubscriptionInput,
  PushSubscriptionRow,
} from "@/types/push";

function mapPushSubscription(row: {
  id: number;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PushSubscriptionRow {
  return {
    id: row.id,
    user_id: row.userId,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    user_agent: row.userAgent,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

export async function upsertPushSubscription(
  input: CreatePushSubscriptionInput,
): Promise<PushSubscriptionRow> {
  const row = await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: input.user_id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.user_agent ?? null,
    },
    update: {
      userId: input.user_id,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.user_agent ?? null,
    },
  });
  return mapPushSubscription(row);
}

export async function listPushSubscriptionsForUser(
  userId: string,
): Promise<PushSubscriptionRow[]> {
  const rows = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  return rows.map(mapPushSubscription);
}

export async function deletePushSubscriptionByEndpoint(
  endpoint: string,
  userId?: string,
): Promise<boolean> {
  const existing = await prisma.pushSubscription.findFirst({
    where: {
      endpoint,
      ...(userId ? { userId } : {}),
    },
  });
  if (!existing) return false;

  await prisma.pushSubscription.delete({
    where: { endpoint },
  });
  return true;
}

export async function deletePushSubscriptionById(id: number): Promise<void> {
  await prisma.pushSubscription.delete({ where: { id } }).catch(() => {
    /* already gone */
  });
}
