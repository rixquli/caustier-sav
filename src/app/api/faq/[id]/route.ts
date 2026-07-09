import { NextResponse } from "next/server";
import { deleteFaq, getFaqById, listFaqHistory, updateFaq } from "@/db/db";
import type { FaqRow } from "@/lib/ai-assistant";
import {
  getSessionUser,
  guardAdmin,
  guardUser,
  authErrorResponse,
} from "@/lib/session";
import type { ApiErrorResponse } from "@/types/user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type FaqHistoryRow = {
  id: number;
  faq_id: number;
  user_id: string | null;
  question: string;
  reponse: string;
  categorie: string | null;
  created_at: string;
  user_nom?: string | null;
  user_prenom?: string | null;
  user_name?: string | null;
};

type UpdateFaqRequest = {
  question: string;
  reponse: string;
  categorie?: string | null;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<
  NextResponse<
    { entry: FaqRow; history: FaqHistoryRow[] } | ApiErrorResponse
  >
> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id } = await params;
  const entry = (await getFaqById(Number(id))) as FaqRow | undefined;

  if (!entry) {
    return NextResponse.json(
      { error: "Entrée introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    entry,
    history:
      auth.user.role === "admin"
        ? ((await listFaqHistory(entry.id)) as FaqHistoryRow[])
        : [],
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<{ entry: FaqRow } | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id } = await params;
  const existing = (await getFaqById(Number(id))) as FaqRow | undefined;

  if (!existing) {
    return NextResponse.json(
      { error: "Entrée introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as UpdateFaqRequest;
    const { question, reponse, categorie } = body;

    if (!question?.trim() || !reponse?.trim()) {
      return NextResponse.json(
        { error: "Question et réponse obligatoires." },
        { status: 400 },
      );
    }

    const entry = (await updateFaq(
      existing.id,
      {
        question: question.trim(),
        reponse: reponse.trim(),
        categorie: categorie?.trim() || null,
      },
      auth.user.id,
    )) as FaqRow;

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<{ success: boolean } | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id } = await params;
  const existing = (await getFaqById(Number(id))) as FaqRow | undefined;

  if (!existing) {
    return NextResponse.json(
      { error: "Entrée introuvable." },
      { status: 404 },
    );
  }

  await deleteFaq(existing.id);
  return NextResponse.json({ success: true });
}
