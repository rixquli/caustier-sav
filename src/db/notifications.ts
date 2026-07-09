import { prisma } from "@/lib/prisma";
import { toIsoString, toIsoStringOrNull } from "./helpers";
import { listAdmins } from "./user";

type NotificationRow = {
  id: number;
  user_id: string;
  type: string;
  demande_id: number | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: {
  id: number;
  userId: string;
  type: string;
  demandeId: number | null;
  message: string;
  read_at: Date | null;
  created_at: Date;
}): NotificationRow {
  return {
    id: row.id,
    user_id: row.userId,
    type: row.type,
    demande_id: row.demandeId,
    message: row.message,
    read_at: toIsoStringOrNull(row.read_at),
    created_at: toIsoString(row.created_at),
  };
}

export async function createNotification({
  userId,
  type,
  demandeId,
  message,
}: {
  userId: string;
  type: string;
  demandeId?: number | null;
  message: string;
}): Promise<NotificationRow> {
  const row = await prisma.notification.create({
    data: {
      userId,
      type,
      demandeId: demandeId ?? null,
      message,
    },
  });
  return mapNotification(row);
}

export async function notifyAdmins({
  type,
  demandeId,
  message,
  excludeUserId = null,
}: {
  type: string;
  demandeId: number;
  message: string;
  excludeUserId?: string | null;
}): Promise<void> {
  const admins = await listAdmins();
  for (const admin of admins) {
    if (excludeUserId && admin.id === excludeUserId) continue;
    await createNotification({ userId: admin.id, type, demandeId, message });
  }
}

export async function listNotificationsForUser(
  userId: string,
  limit = 30,
): Promise<NotificationRow[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
  return rows.map(mapNotification);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read_at: null },
  });
}

export async function markNotificationRead(
  id: number,
  userId: string,
): Promise<NotificationRow | null> {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const row = await prisma.notification.update({
    where: { id },
    data: { read_at: existing.read_at ?? new Date() },
  });
  return mapNotification(row);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read_at: null },
    data: { read_at: new Date() },
  });
}
