import { NextResponse } from "next/server";
import {
  deleteDemande,
  getDemandeById,
  listActivityForDemande,
  listMessagesForDemande,
  listNotesForDemande,
  updateDemande,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";

export async function GET(_request, { params }) {
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

  const isAdmin = user.role === "admin";

  if (isAdmin) {
    updateDemande(demande.id, { read_by_admin: true }, user.id);
  } else {
    updateDemande(demande.id, { read_by_client: true }, user.id);
  }

  return NextResponse.json({
    demande: getDemandeById(demande.id),
    messages: listMessagesForDemande(demande.id),
    notes: isAdmin ? listNotesForDemande(demande.id) : [],
    activity: listActivityForDemande(demande.id, !isAdmin),
  });
}

export async function PATCH(request, { params }) {
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

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = updateDemande(
      demande.id,
      {
        titre: body.titre,
        description: body.description,
        type: body.type,
        priorite: body.priorite,
        status: body.status,
        assigned_to: body.assignedTo ?? body.assigned_to,
        machine_id: body.machineId ?? body.machine_id,
        user_id: body.userId ?? body.user_id,
        notes_admin: body.notes_admin,
      },
      user.id,
    );

    return NextResponse.json({ demande: updated });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const deleted = deleteDemande(Number(id));

  if (!deleted) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
