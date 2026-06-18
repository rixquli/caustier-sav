import { NextResponse } from "next/server";
import {
  findAppUserById,
  formatUserDisplay,
  listMachinesForUser,
  updateAppUser,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";
import { generateTempPassword, setUserPassword } from "@/lib/password-utils";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const client = formatUserDisplay(findAppUserById(id));

  if (!client || client.role !== "client") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    client,
    machines: listMachinesForUser(id),
  });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const existing = findAppUserById(id);

  if (!existing || existing.role !== "client") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { nom, prenom, email, phone, adresse, archived, resetPassword, notes_admin } = body;

    let tempPassword = null;

    if (resetPassword) {
      tempPassword = generateTempPassword();
      await setUserPassword(id, tempPassword);
      updateAppUser(id, { mustChangePassword: 1 });
    }

    const name = [prenom?.trim() ?? existing.prenom, nom?.trim() ?? existing.nom]
      .filter(Boolean)
      .join(" ");

    const updated = updateAppUser(id, {
      nom: nom?.trim() ?? existing.nom,
      prenom: prenom?.trim() ?? existing.prenom,
      phone: phone?.trim() ?? existing.phone,
      adresse: adresse?.trim() ?? existing.adresse,
      archived: archived !== undefined ? (archived ? 1 : 0) : existing.archived,
      name: name || existing.name,
      notes_admin: notes_admin !== undefined ? (notes_admin?.trim() || null) : existing.notes_admin,
    });

    if (email?.trim() && email.trim() !== existing.email) {
      const { db } = await import("@/db/db");
      db.prepare("UPDATE user SET email = ? WHERE id = ?").run(email.trim(), id);
    }

    return NextResponse.json({
      client: formatUserDisplay(findAppUserById(id)),
      machines: listMachinesForUser(id),
      tempPassword,
    });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
