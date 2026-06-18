import { NextResponse } from "next/server";
import { createClientNote, findAppUserById, listClientNotes } from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const client = findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  return NextResponse.json({ notes: listClientNotes(id) });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const client = findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!body.contenu?.trim()) {
      return NextResponse.json({ error: "Contenu obligatoire." }, { status: 400 });
    }

    const note = createClientNote({
      userId: id,
      adminId: user.id,
      contenu: body.contenu.trim(),
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
