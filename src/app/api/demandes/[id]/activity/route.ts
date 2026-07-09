import { NextResponse } from "next/server";
import { getDemandeById, listActivityForDemande } from "@/db/db";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
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
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  const { id } = await params;
  const demande = await getDemandeById(Number(id));

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
    activity: await listActivityForDemande(demande.id, publicOnly),
  });
}
