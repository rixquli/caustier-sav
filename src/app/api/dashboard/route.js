import { NextResponse } from "next/server";
import { getRecentDemandes } from "@/db/db";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/constants";
import { getSessionUser, requireUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const isAdmin = user.role === "admin";
  const recent = getRecentDemandes(20, isAdmin ? null : user.id);

  const actives = recent.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const history = recent.filter((d) => CLOSED_STATUSES.includes(d.status));

  return NextResponse.json({ actives, history, recent });
}
