import { NextResponse } from "next/server";
import { getDemandeById, listActivityForDemande } from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";
import type {
  ApiErrorResponse,
  ListDemandeActivityResponse,
} from "@/types/demande";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ListDemandeActivityResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const demande = getDemandeById(Number(id));

  if (!demande) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  if (user.role !== "admin" && demande.user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const publicOnly = user.role !== "admin";
  return NextResponse.json({
    activity: listActivityForDemande(demande.id, publicOnly),
  });
}
