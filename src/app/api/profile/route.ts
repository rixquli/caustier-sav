import { NextResponse } from "next/server";
import {
  formatUserDisplay,
  listMachinesForUser,
  updateAppUser,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";
import type {
  ApiErrorResponse,
  ClientMachineSummary,
  ProfileResponse,
  UpdateProfileRequest,
} from "@/types/user";

export async function GET(): Promise<
  NextResponse<ProfileResponse | ApiErrorResponse>
> {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const machines =
    user!.role === "client"
      ? ((await listMachinesForUser(user!.id)) as ClientMachineSummary[])
      : [];

  return NextResponse.json({ user: user!, machines });
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<ProfileResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  try {
    const body = (await request.json()) as UpdateProfileRequest;
    const { nom, prenom, phone, adresse } = body;

    if (!nom?.trim()) {
      return NextResponse.json(
        { error: "Le nom est obligatoire." },
        { status: 400 },
      );
    }

    const name = [prenom?.trim(), nom.trim()].filter(Boolean).join(" ");
    const updated = await updateAppUser(user!.id, {
      nom: nom.trim(),
      prenom: prenom?.trim() || null,
      phone: phone?.trim() || null,
      adresse: adresse?.trim() || null,
      name,
    });

    const displayUser = formatUserDisplay(updated);
    if (!displayUser) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      user: displayUser,
      machines: (await listMachinesForUser(user!.id)) as ClientMachineSummary[],
    });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
