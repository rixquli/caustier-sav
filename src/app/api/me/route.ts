import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import type { ApiErrorResponse, MeResponse } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(): Promise<
  NextResponse<MeResponse | ApiErrorResponse>
> {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  return NextResponse.json({ user });
}
