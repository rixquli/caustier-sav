import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import {
  findAppUserByEmail,
  formatUserDisplay,
  listClients,
  updateAppUser,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";
import { generateTempPassword, setUserPassword } from "@/lib/password-utils";

export async function GET(request) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const includeArchived = searchParams.get("archived") === "1";

  const clients = listClients({ search, includeArchived }).map(formatUserDisplay);
  return NextResponse.json({ clients });
}

export async function POST(request) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
    const { nom, prenom, email, phone, adresse, password } = body;

    if (!nom?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nom et email obligatoires." },
        { status: 400 },
      );
    }

    if (findAppUserByEmail(email.trim())) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    const tempPassword = password?.trim() || generateTempPassword();
    const displayName = [prenom?.trim(), nom.trim()].filter(Boolean).join(" ");

    await auth.api.signUpEmail({
      body: {
        email: email.trim(),
        password: tempPassword,
        name: displayName || nom.trim(),
      },
    });

    updateAppUser(findAppUserByEmail(email.trim()).id, {
      nom: nom.trim(),
      prenom: prenom?.trim() || null,
      phone: phone?.trim() || null,
      adresse: adresse?.trim() || null,
      role: "client",
      mustChangePassword: 1,
      archived: 0,
      name: displayName || nom.trim(),
    });

    const client = formatUserDisplay(findAppUserByEmail(email.trim()));

    return NextResponse.json(
      { client, tempPassword },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
