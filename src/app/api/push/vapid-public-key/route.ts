import { NextResponse } from "next/server";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import { getVapidPublicKey } from "@/lib/web-push";
import type { ApiErrorResponse, VapidPublicKeyResponse } from "@/types/push";

export async function GET(): Promise<
  NextResponse<VapidPublicKeyResponse | ApiErrorResponse>
> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "Web Push non configuré sur le serveur." },
      { status: 503 },
    );
  }

  return NextResponse.json({ publicKey });
}
