import { NextResponse } from "next/server";
import { listAdmins, listClients } from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  return NextResponse.json({
    clients: listClients(),
    admins: listAdmins(),
  });
}
