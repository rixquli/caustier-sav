import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserById } from "@/db/db";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = findUserById(Number(sessionId));

  if (!user) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  return NextResponse.json({ user });
}
