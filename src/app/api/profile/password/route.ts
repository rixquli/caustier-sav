import { NextResponse } from "next/server";
import { updateAppUser } from "@/db/db";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import { setUserPassword } from "@/lib/password-utils";
import type { ApiErrorResponse } from "@/types/user";

export const dynamic = "force-dynamic";

type ChangePasswordRequest = {
  password: string;
  confirm: string;
};

export async function POST(
  request: Request,
): Promise<NextResponse<{ success: boolean } | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  try {
    const body = (await request.json()) as ChangePasswordRequest;
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

    await setUserPassword(auth.user.id, password);
    await updateAppUser(auth.user.id, { mustChangePassword: 0 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
