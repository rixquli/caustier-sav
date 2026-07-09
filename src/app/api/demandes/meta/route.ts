import { NextResponse } from "next/server";
import { listAdmins, listClients, listTechnicians } from "@/db/db";
import { formatTechnicienDisplay } from "@/db/technicien";
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

  const technicians = listTechnicians()
    .map((row) => formatTechnicienDisplay(row))
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map((technicien) => ({
      id: String(technicien.id),
      name: technicien.name,
      email: technicien.email,
      specialite: technicien.specialite,
      telephone: technicien.telephone,
    }));

  return NextResponse.json({
    clients: listClients(),
    admins: listAdmins(),
    technicians,
  });
}
