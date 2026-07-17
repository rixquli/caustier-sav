import { NextResponse } from "next/server";
import {
  formatUserDisplay,
  listMachinesForUser,
  updateAppUser,
  updateUserEmail,
  findAppUserByEmail,
} from "@/db/db";
import {
  getTechnicienByUserId,
  updateTechnician,
} from "@/db/technicien";
import { getSessionUser, requireUser } from "@/lib/session";
import type {
  ApiErrorResponse,
  ClientMachineSummary,
  ProfileResponse,
  UpdateProfileRequest,
} from "@/types/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const techRow = await getTechnicienByUserId(user!.id);
  const technicien = techRow
    ? {
        id: techRow.id,
        specialite: techRow.specialite,
        telephone: techRow.telephone,
        email: techRow.email,
      }
    : null;

  return NextResponse.json({ user: user!, machines, technicien });
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
    const { nom, prenom, phone, adresse, email, specialite } = body;

    if (!nom?.trim()) {
      return NextResponse.json(
        { error: "Le nom est obligatoire." },
        { status: 400 },
      );
    }

    const techRow = await getTechnicienByUserId(user!.id);
    const isTechAdmin = Boolean(techRow);

    let nextEmail = user!.email;
    if (isTechAdmin && email?.trim()) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!EMAIL_RE.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "Format d'email invalide." },
          { status: 400 },
        );
      }
      if (trimmedEmail !== user!.email.toLowerCase()) {
        const taken = await findAppUserByEmail(trimmedEmail);
        if (taken && taken.id !== user!.id) {
          return NextResponse.json(
            { error: "Cet email est déjà utilisé." },
            { status: 409 },
          );
        }
        await updateUserEmail(user!.id, trimmedEmail);
        nextEmail = trimmedEmail;
      }
    }

    const name = [prenom?.trim(), nom.trim()].filter(Boolean).join(" ");
    const updated = await updateAppUser(user!.id, {
      nom: nom.trim(),
      prenom: prenom?.trim() || null,
      phone: phone?.trim() || null,
      ...(adresse !== undefined
        ? { adresse: adresse?.trim() || null }
        : {}),
      name: isTechAdmin ? nom.trim() : name,
    });

    if (techRow) {
      await updateTechnician(techRow.id, {
        name: nom.trim(),
        phone: phone?.trim() ?? techRow.telephone,
        email: nextEmail,
        specialite:
          specialite !== undefined
            ? specialite.trim()
            : techRow.specialite,
      });
    }

    const displayUser = formatUserDisplay(updated);
    if (!displayUser) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    // Refresh email on display if changed
    if (nextEmail !== displayUser.email) {
      displayUser.email = nextEmail;
    }

    const refreshedTech = await getTechnicienByUserId(user!.id);

    return NextResponse.json({
      user: displayUser,
      machines:
        user!.role === "client"
          ? ((await listMachinesForUser(user!.id)) as ClientMachineSummary[])
          : [],
      technicien: refreshedTech
        ? {
            id: refreshedTech.id,
            specialite: refreshedTech.specialite,
            telephone: refreshedTech.telephone,
            email: refreshedTech.email,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
