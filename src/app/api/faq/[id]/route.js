import { NextResponse } from "next/server";
import {
  deleteFaq,
  getFaqById,
  listFaqHistory,
  updateFaq,
} from "@/db/db";
import { getSessionUser, requireAdmin, requireUser } from "@/lib/session";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const entry = getFaqById(Number(id));

  if (!entry) {
    return NextResponse.json({ error: "Entrée introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    entry,
    history: user.role === "admin" ? listFaqHistory(entry.id) : [],
  });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const existing = getFaqById(Number(id));

  if (!existing) {
    return NextResponse.json({ error: "Entrée introuvable." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { question, reponse, categorie } = body;

    if (!question?.trim() || !reponse?.trim()) {
      return NextResponse.json(
        { error: "Question et réponse obligatoires." },
        { status: 400 },
      );
    }

    const entry = updateFaq(
      existing.id,
      {
        question: question.trim(),
        reponse: reponse.trim(),
        categorie: categorie?.trim() || null,
      },
      user.id,
    );

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const existing = getFaqById(Number(id));

  if (!existing) {
    return NextResponse.json({ error: "Entrée introuvable." }, { status: 404 });
  }

  deleteFaq(existing.id);
  return NextResponse.json({ success: true });
}
