import { NextResponse } from "next/server";
import {
  findAppUserById,
  formatUserDisplay,
  listMachinesForUser,
  updateAppUser,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { setUserPassword } from "@/lib/password-utils";

export async function GET() {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const machines =
    user.role === "client" ? listMachinesForUser(user.id) : [];

  return NextResponse.json({ user, machines });
}

export async function PATCH(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
    const { nom, prenom, phone, adresse } = body;

    if (!nom?.trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });
    }

    const name = [prenom?.trim(), nom.trim()].filter(Boolean).join(" ");
    const updated = updateAppUser(user.id, {
      nom: nom.trim(),
      prenom: prenom?.trim() || null,
      phone: phone?.trim() || null,
      adresse: adresse?.trim() || null,
      name,
    });

    return NextResponse.json({
      user: formatUserDisplay(updated),
      machines: listMachinesForUser(user.id),
    });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
