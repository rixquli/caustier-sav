import { NextResponse } from "next/server";
import { findUserByEmail } from "@/db/db";
import { verifyPassword } from "@/lib/password";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Remplissez tous les champs." },
        { status: 400 },
      );
    }

    const user = findUserByEmail(email.trim());

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    response.cookies.set("session", String(user.id), cookieOptions);
    response.cookies.set("role", user.role, cookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
