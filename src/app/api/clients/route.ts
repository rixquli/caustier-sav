import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth-server";
import {
  findAppUserByEmail,
  formatUserDisplay,
  listClients,
  updateAppUser,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";
import { generateTempPassword, setUserPassword } from "@/lib/password-utils";
import type {
  ApiErrorResponse,
  CreateClientRequest,
  CreateClientResponse,
  ListClientsResponse,
} from "@/types/user";

export async function GET(
  request: Request,
): Promise<NextResponse<ListClientsResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const includeArchived = searchParams.get("archived") === "1";

  const clients = (await listClients({ search, includeArchived }))
    .map(formatUserDisplay)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return NextResponse.json({ clients });
}

export async function POST(
  request: Request,
): Promise<NextResponse<CreateClientResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  try {
    const body = (await request.json()) as CreateClientRequest;
    const { nom, prenom, email, phone, adresse, password } = body;

    if (!nom?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nom et email obligatoires." },
        { status: 400 },
      );
    }

    if (await findAppUserByEmail(email.trim())) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }

    const tempPassword = password?.trim() || generateTempPassword();
    const displayName = [prenom?.trim(), nom.trim()].filter(Boolean).join(" ");

    await getAuth().api.signUpEmail({
      body: {
        email: email.trim(),
        password: tempPassword,
        name: displayName || nom.trim(),
      },
    });

    const created = await findAppUserByEmail(email.trim());
    if (!created) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    await updateAppUser(created.id, {
      nom: nom.trim(),
      prenom: prenom?.trim() || null,
      phone: phone?.trim() || null,
      adresse: adresse?.trim() || null,
      mustChangePassword: 1,
      archived: 0,
      name: displayName || nom.trim(),
    });

    const client = formatUserDisplay(await findAppUserByEmail(email.trim()));
    if (!client) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ client, tempPassword }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
