import { NextResponse } from "next/server";
import {
  createFaq,
  deleteFaq,
  getFaqById,
  listFaq,
  listFaqCategories,
  listFaqHistory,
  updateFaq,
} from "@/db/db";
import { getSessionUser, requireAdmin, requireUser } from "@/lib/session";

export async function GET(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get("categorie") || undefined;
  const search = searchParams.get("search") || undefined;

  return NextResponse.json({
    faq: listFaq({ categorie, search }),
    categories: listFaqCategories(),
  });
}

export async function POST(request) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
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

    const entry = createFaq({
      question: question.trim(),
      reponse: reponse.trim(),
      categorie: categorie?.trim() || null,
      userId: user.id,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
