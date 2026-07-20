import { prisma } from "@/lib/prisma";
import { toIsoString, toIsoStringOrNull } from "./helpers";
import { findAppUserById, listAdmins } from "./user";
import { getNotificationHref, NOTIFICATION_TYPES } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/web-push";
import { logger } from "@/lib/logger";

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

function pushNotificationTitle(type: string): string {
  if (type === NOTIFICATION_TYPES.DEMANDE_ASSIGNEE) {
    return "Demande assignée";
  }
  if (type === NOTIFICATION_TYPES.NOUVELLE_DEMANDE) {
    return "Nouvelle demande";
  }
  if (type === NOTIFICATION_TYPES.REPONSE_CLIENT) {
    return "Réponse client";
  }
  if (type === NOTIFICATION_TYPES.REPONSE_ADMIN) {
    return "Réponse SAV";
  }
  if (type === NOTIFICATION_TYPES.STATUT_CHANGE) {
    return "Statut mis à jour";
  }
  return "Nouvelle notification";
}

async function dispatchPushForNotification(
  notification: NotificationRow,
): Promise<void> {
  try {
    const user = await findAppUserById(notification.user_id);
    const isAdmin = user?.role === "admin";
    const url = getNotificationHref(notification, isAdmin);

    await sendPushToUser(notification.user_id, {
      title: pushNotificationTitle(notification.type),
      body: notification.message,
      url,
      tag: `notif-${notification.id}`,
    });
  } catch (err: unknown) {
    logger.warn("Failed to dispatch Web Push for notification", {
      notificationId: notification.id,
      userId: notification.user_id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
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
  const notification = mapNotification(row);

  // Fire-and-forget : ne bloque / n'annule pas la création en DB
  void dispatchPushForNotification(notification);

  return notification;
}

export async function notifyAdmins({
  type,
  demandeId,
  message,
  excludeUserId = null,
  excludeUserIds = [],
}: {
  type: string;
  demandeId: number;
  message: string;
  excludeUserId?: string | null;
  excludeUserIds?: string[];
}): Promise<void> {
  const excluded = new Set(
    [excludeUserId, ...excludeUserIds].filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    ),
  );
  const admins = await listAdmins();
  for (const admin of admins) {
    if (excluded.has(admin.id)) continue;
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
