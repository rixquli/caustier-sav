import { NextResponse } from "next/server";
import {
  createClientNote,
  findAppUserById,
  listClientNotes,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type {
  ApiErrorResponse,
  CreateClientNoteRequest,
  CreateClientNoteResponse,
  ListClientNotesResponse,
} from "@/types/user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ListClientNotesResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const client = await findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json(
      { error: "Client introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ notes: await listClientNotes(id) });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<CreateClientNoteResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const client = await findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json(
      { error: "Client introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as CreateClientNoteRequest;
    if (!body.contenu?.trim()) {
      return NextResponse.json(
        { error: "Contenu obligatoire." },
        { status: 400 },
      );
    }

    const note = await createClientNote({
      userId: id,
      adminId: user!.id,
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
