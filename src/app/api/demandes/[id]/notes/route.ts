import { NextResponse } from "next/server";
import {
  createNote,
  deleteNote,
  getDemandeById,
  listNotesForDemande,
  updateNote,
} from "@/db/db";
import { getSessionUser, guardAdmin, authErrorResponse } from "@/lib/session";
import type {
  ApiErrorResponse,
  CreateDemandeNoteRequest,
  CreateDemandeNoteResponse,
  DeleteDemandeNoteResponse,
  ListDemandeNotesResponse,
  UpdateDemandeNoteRequest,
  UpdateDemandeNoteResponse,
} from "@/types/demande";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ListDemandeNotesResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
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

  return NextResponse.json({ notes: await listNotesForDemande(demande.id) });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<CreateDemandeNoteResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
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

  try {
    const body = (await request.json()) as CreateDemandeNoteRequest;
    if (!body.contenu?.trim()) {
      return NextResponse.json(
        { error: "Contenu obligatoire." },
        { status: 400 },
      );
    }

    const note = await createNote({
      demandeId: demande.id,
      userId: user.id,
      contenu: body.contenu.trim(),
    });

    if (!note) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<UpdateDemandeNoteResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  const body = (await request.json()) as UpdateDemandeNoteRequest;
  const { noteId, contenu } = body;

  if (!contenu?.trim()) {
    return NextResponse.json(
      { error: "Contenu obligatoire." },
      { status: 400 },
    );
  }

  const note = await updateNote(noteId, contenu.trim(), user.id);
  if (!note) {
    return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
  }

  return NextResponse.json({ note });
}

export async function DELETE(
  request: Request,
): Promise<NextResponse<DeleteDemandeNoteResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  const { searchParams } = new URL(request.url);
  const noteId = Number(searchParams.get("noteId"));
  const note = await deleteNote(noteId, user.id);

  if (!note) {
    return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
