import { NextResponse } from "next/server";
import {
  createTechnicianNote,
  getTechnicianById,
  listTechnicianNotes,
} from "@/db/technicien";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type {
  ApiErrorResponse,
  CreateTechnicienNoteRequest,
  CreateTechnicienNoteResponse,
  ListTechnicienNotesResponse,
} from "@/types/technicien";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ListTechnicienNotesResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const technicien = await getTechnicianById(id);
  if (!technicien) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ notes: await listTechnicianNotes(id) });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<CreateTechnicienNoteResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const technicien = await getTechnicianById(id);
  if (!technicien) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as CreateTechnicienNoteRequest;
    if (!body.contenu?.trim()) {
      return NextResponse.json(
        { error: "Contenu obligatoire." },
        { status: 400 },
      );
    }

    const note = await createTechnicianNote({
      technicien_id: id,
      contenu: body.contenu.trim(),
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
