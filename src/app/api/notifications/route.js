import { NextResponse } from "next/server";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const notifications = listNotificationsForUser(user.id);
  const unreadCount = countUnreadNotifications(user.id);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();

    if (body.all) {
      markAllNotificationsRead(user.id);
      return NextResponse.json({ ok: true, unreadCount: 0 });
    }

    if (!body.id) {
      return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    }

    const updated = markNotificationRead(Number(body.id), user.id);
    if (!updated) {
      return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      unreadCount: countUnreadNotifications(user.id),
    });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
