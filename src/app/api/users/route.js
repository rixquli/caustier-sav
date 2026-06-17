import { NextResponse } from "next/server";
import { createUser, findUserByEmail, listUsers } from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  return NextResponse.json({ users: listUsers() });
}

export async function POST(request) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
    const { nom, email, password, phone } = body;

    if (!nom?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe obligatoires." },
        { status: 400 },
      );
    }

    if (findUserByEmail(email.trim())) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }

    const newUser = createUser({
      nom: nom.trim(),
      email: email.trim(),
      password,
      role: "client",
      phone: phone?.trim() || null,
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          nom: newUser.nom,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
