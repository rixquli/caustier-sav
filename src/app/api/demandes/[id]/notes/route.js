import { NextResponse } from "next/server";
import {
  createNote,
  deleteNote,
  getDemandeById,
  listNotesForDemande,
  updateNote,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const demande = getDemandeById(Number(id));
  if (!demande) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ notes: listNotesForDemande(demande.id) });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const demande = getDemandeById(Number(id));
  if (!demande) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!body.contenu?.trim()) {
      return NextResponse.json({ error: "Contenu obligatoire." }, { status: 400 });
    }

    const note = createNote({
      demandeId: demande.id,
      userId: user.id,
      contenu: body.contenu.trim(),
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const body = await request.json();
  const { noteId, contenu } = body;

  if (!contenu?.trim()) {
    return NextResponse.json({ error: "Contenu obligatoire." }, { status: 400 });
  }

  const note = updateNote(noteId, contenu.trim(), user.id);
  if (!note) {
    return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
  }

  return NextResponse.json({ note });
}

export async function DELETE(request) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { searchParams } = new URL(request.url);
  const noteId = Number(searchParams.get("noteId"));
  const note = deleteNote(noteId, user.id);

  if (!note) {
    return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
