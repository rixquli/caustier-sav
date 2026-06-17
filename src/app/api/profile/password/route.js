import { NextResponse } from "next/server";
import { updateAppUser } from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { setUserPassword } from "@/lib/password-utils";

export async function POST(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
    const { password, confirm } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }

    if (password !== confirm) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas." },
        { status: 400 },
      );
    }

    await setUserPassword(user.id, password);
    updateAppUser(user.id, { mustChangePassword: false });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
