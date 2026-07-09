import { NextResponse } from "next/server";
import { createFaq, listFaq, listFaqCategories } from "@/db/db";
import type { FaqRow } from "@/lib/ai-assistant";
import {
  getSessionUser,
  guardAdmin,
  guardUser,
  authErrorResponse,
} from "@/lib/session";
import type { ApiErrorResponse } from "@/types/user";

type ListFaqResponse = {
  faq: FaqRow[];
  categories: string[];
};

type CreateFaqRequest = {
  question: string;
  reponse: string;
  categorie?: string | null;
};

export async function GET(
  request: Request,
): Promise<NextResponse<ListFaqResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get("categorie") || undefined;
  const search = searchParams.get("search") || undefined;

  return NextResponse.json({
    faq: (await listFaq({ categorie, search })) as FaqRow[],
    categories: await listFaqCategories(),
  });
}

export async function POST(
  request: Request,
): Promise<NextResponse<{ entry: FaqRow } | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  try {
    const body = (await request.json()) as CreateFaqRequest;
    const { question, reponse, categorie } = body;

    if (!question?.trim() || !reponse?.trim()) {
      return NextResponse.json(
        { error: "Question et réponse obligatoires." },
        { status: 400 },
      );
    }

    const entry = (await createFaq({
      question: question.trim(),
      reponse: reponse.trim(),
      categorie: categorie?.trim() || null,
      userId: auth.user.id,
    })) as FaqRow;

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
