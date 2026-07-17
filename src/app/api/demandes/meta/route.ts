import { NextResponse } from "next/server";
import { listAdmins, listClients, listTechnicians } from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type { ApiErrorResponse, DemandeMetaResponse } from "@/types/demande";

export async function GET(): Promise<
  NextResponse<DemandeMetaResponse | ApiErrorResponse>
> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const technicians = (await listTechnicians()).map((technicien) => ({
    id: String(technicien.id),
    name: technicien.name,
    email: technicien.email,
    specialite: technicien.specialite,
    telephone: technicien.telephone,
    userId: technicien.userId,
  }));

  return NextResponse.json({
    clients: await listClients(),
    admins: await listAdmins(),
    technicians,
  });
}
