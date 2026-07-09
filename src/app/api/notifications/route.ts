import { NextResponse } from "next/server";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/db";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import type { NotificationRow } from "@/lib/notifications";
import type { ApiErrorResponse } from "@/types/user";

type NotificationsResponse = {
  notifications: NotificationRow[];
  unreadCount: number;
};

type PatchNotificationsRequest = {
  id?: number;
  all?: boolean;
};

export async function GET(): Promise<
  NextResponse<NotificationsResponse | ApiErrorResponse>
> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const notifications = (await listNotificationsForUser(
    auth.user.id,
  )) as NotificationRow[];
  const unreadCount = await countUnreadNotifications(auth.user.id);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<{ ok: boolean; unreadCount?: number } | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  try {
    const body = (await request.json()) as PatchNotificationsRequest;

    if (body.all) {
      await markAllNotificationsRead(auth.user.id);
      return NextResponse.json({ ok: true, unreadCount: 0 });
    }

    if (!body.id) {
      return NextResponse.json(
        { error: "Identifiant manquant." },
        { status: 400 },
      );
    }

    const updated = await markNotificationRead(body.id, auth.user.id);
    if (!updated) {
      return NextResponse.json(
        { error: "Notification introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      unreadCount: await countUnreadNotifications(auth.user.id),
    });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
