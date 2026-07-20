import { NextResponse } from "next/server";
import {
  deletePushSubscriptionByEndpoint,
  upsertPushSubscription,
} from "@/db/db";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import type {
  ApiErrorResponse,
  SubscribePushRequest,
  SubscribePushResponse,
  UnsubscribePushRequest,
  UnsubscribePushResponse,
} from "@/types/push";

function isValidSubscribeBody(
  body: SubscribePushRequest,
): body is SubscribePushRequest {
  return (
    typeof body?.endpoint === "string" &&
    body.endpoint.length > 0 &&
    typeof body?.keys?.p256dh === "string" &&
    body.keys.p256dh.length > 0 &&
    typeof body?.keys?.auth === "string" &&
    body.keys.auth.length > 0
  );
}

export async function POST(
  request: Request,
): Promise<NextResponse<SubscribePushResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  try {
    const body = (await request.json()) as SubscribePushRequest;
    if (!isValidSubscribeBody(body)) {
      return NextResponse.json(
        { error: "Abonnement push invalide." },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get("user-agent");
    const subscription = await upsertPushSubscription({
      user_id: auth.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: userAgent,
    });

    return NextResponse.json({
      ok: true as const,
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        user_id: subscription.user_id,
        created_at: subscription.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'abonnement push." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
): Promise<NextResponse<UnsubscribePushResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  try {
    const body = (await request.json()) as UnsubscribePushRequest;
    if (typeof body?.endpoint !== "string" || !body.endpoint) {
      return NextResponse.json(
        { error: "Endpoint manquant." },
        { status: 400 },
      );
    }

    await deletePushSubscriptionByEndpoint(body.endpoint, auth.user.id);
    return NextResponse.json({ ok: true as const });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer l'abonnement push." },
      { status: 500 },
    );
  }
}
