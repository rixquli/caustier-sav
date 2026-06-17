import { NextResponse } from "next/server";
import { listFaq } from "@/db/db";
import { findFaqMatches } from "@/lib/faq-matcher";
import { getSessionUser, requireUser } from "@/lib/auth";

export async function POST(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const faq = listFaq();
    const suggestions = findFaqMatches(text, faq);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
