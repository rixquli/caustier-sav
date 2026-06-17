import { NextResponse } from "next/server";
import { addMessage, getDemandeById } from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const demande = getDemandeById(Number(id));

  if (!demande) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  if (user.role !== "admin" && demande.user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  if (demande.status === "fermee") {
    return NextResponse.json({ error: "Cette demande est clôturée." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { contenu } = body;

    if (!contenu?.trim()) {
      return NextResponse.json({ error: "Le message ne peut pas être vide." }, { status: 400 });
    }

    const message = addMessage({
      demandeId: demande.id,
      userId: user.id,
      contenu: contenu.trim(),
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
