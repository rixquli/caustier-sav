import { NextResponse } from "next/server";
import { addMessage, getDemandeById } from "@/db/db";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import type {
  ApiErrorResponse,
  CreateDemandeMessageRequest,
  CreateDemandeMessageResponse,
} from "@/types/demande";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<CreateDemandeMessageResponse | ApiErrorResponse>> {
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

  if (demande.status === "fermee") {
    return NextResponse.json(
      { error: "Cette demande est clôturée." },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as CreateDemandeMessageRequest;
    const { contenu } = body;

    if (!contenu?.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide." },
        { status: 400 },
      );
    }

    const message = await addMessage({
      demandeId: demande.id,
      userId: user.id,
      contenu: contenu.trim(),
    });

    if (!message) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
