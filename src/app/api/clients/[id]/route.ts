import { NextResponse } from "next/server";
import {
  findAppUserById,
  formatUserDisplay,
  listMachinesForUser,
  updateAppUser,
  updateUserEmail,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";
import { generateTempPassword, setUserPassword } from "@/lib/password-utils";
import type {
  ApiErrorResponse,
  ClientDetailResponse,
  ClientMachineSummary,
  UpdateClientRequest,
  UpdateClientResponse,
} from "@/types/user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<ClientDetailResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const client = formatUserDisplay(await findAppUserById(id));

  if (!client || client.role !== "client") {
    return NextResponse.json(
      { error: "Client introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    client,
    machines: (await listMachinesForUser(id)) as ClientMachineSummary[],
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<UpdateClientResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const existing = await findAppUserById(id);

  if (!existing || existing.role !== "client") {
    return NextResponse.json(
      { error: "Client introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as UpdateClientRequest;
    const {
      nom,
      prenom,
      email,
      phone,
      adresse,
      archived,
      resetPassword,
      notes_admin,
    } = body;

    let tempPassword: string | null = null;

    if (resetPassword) {
      tempPassword = generateTempPassword();
      await setUserPassword(id, tempPassword);
      await updateAppUser(id, { mustChangePassword: 1 });
    }

    const name = [prenom?.trim() ?? existing.prenom, nom?.trim() ?? existing.nom]
      .filter(Boolean)
      .join(" ");

    await updateAppUser(id, {
      nom: nom?.trim() ?? existing.nom,
      prenom: prenom?.trim() ?? existing.prenom,
      phone: phone?.trim() ?? existing.phone,
      adresse: adresse?.trim() ?? existing.adresse,
      archived:
        archived !== undefined
          ? archived
            ? 1
            : 0
          : (existing.archived ?? undefined),
      name: name || existing.name,
      notes_admin:
        notes_admin !== undefined
          ? notes_admin?.trim() || null
          : existing.notes_admin,
    });

    if (email?.trim() && email.trim() !== existing.email) {
      await updateUserEmail(id, email.trim());
    }

    const client = formatUserDisplay(await findAppUserById(id));
    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      client,
      machines: (await listMachinesForUser(id)) as ClientMachineSummary[],
      tempPassword,
    });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
