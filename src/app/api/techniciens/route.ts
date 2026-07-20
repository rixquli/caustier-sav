import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth-server";
import {
  createTechnician,
  findTechnicianByEmail,
  formatTechnicienDisplay,
  getTechnicienByUserId,
  getTechnicienDisplayById,
  listTechnicians,
  updateTechnician,
} from "@/db/technicien";
import { findAppUserByEmail, updateAppUser } from "@/db/user";
import { sendTechnicianWelcomeEmail } from "@/lib/mail";
import { generateTempPassword, setUserPassword } from "@/lib/password-utils";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type {
  ApiErrorResponse,
  CreateTechnicienRequest,
  CreateTechnicienResponse,
  ListTechniciansResponse,
} from "@/types/technicien";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isArchivedFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export async function GET(
  request: Request,
): Promise<NextResponse<ListTechniciansResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const techniciens = await listTechnicians({ search });

  return NextResponse.json({ techniciens });
}

export async function POST(
  request: Request,
): Promise<NextResponse<CreateTechnicienResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  try {
    const body = (await request.json()) as CreateTechnicienRequest;
    const { name, specialite, phone, email, notes } = body;

    const trimmedName = name?.trim() ?? "";
    const trimmedEmail = email?.trim().toLowerCase() ?? "";

    if (!trimmedName || !trimmedEmail) {
      return NextResponse.json(
        { error: "Nom et email obligatoires." },
        { status: 400 },
      );
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
        { status: 400 },
      );
    }

    const existingUser = await findAppUserByEmail(trimmedEmail);
    const existingTechByEmail = await findTechnicianByEmail(trimmedEmail);
    const existingTechByUser = existingUser
      ? await getTechnicienByUserId(existingUser.id)
      : null;
    const existingTech = existingTechByEmail ?? existingTechByUser;
    const userIsArchived = Boolean(
      existingUser && isArchivedFlag(existingUser.archived),
    );

    // Compte actif déjà pris → refus.
    if (existingUser && !userIsArchived) {
      return NextResponse.json(
        {
          error: existingTech
            ? "Cet email est déjà utilisé par un technicien."
            : "Cet email est déjà utilisé.",
        },
        { status: 409 },
      );
    }

    if (existingTech && !userIsArchived) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé par un technicien." },
        { status: 409 },
      );
    }

    const tempPassword = generateTempPassword();
    let technicienId: number;

    // Compte archivé : réactivation (fiche tech existante ou orpheline).
    if (existingUser && userIsArchived) {
      await setUserPassword(existingUser.id, tempPassword);
      await updateAppUser(existingUser.id, {
        role: "admin",
        name: trimmedName,
        nom: trimmedName,
        phone: phone?.trim() || null,
        mustChangePassword: 1,
        archived: 0,
      });

      if (existingTech) {
        const updated = await updateTechnician(existingTech.id, {
          name: trimmedName,
          specialite,
          phone,
          email: trimmedEmail,
          notes_technicien: notes?.trim() || null,
          userId: existingUser.id,
        });
        if (!updated) {
          return NextResponse.json(
            { error: "Une erreur est survenue." },
            { status: 500 },
          );
        }
        technicienId = updated.id;
      } else {
        const row = await createTechnician({
          name: trimmedName,
          email: trimmedEmail,
          specialite,
          phone,
          notes,
          userId: existingUser.id,
        });
        if (!row) {
          return NextResponse.json(
            { error: "Une erreur est survenue." },
            { status: 500 },
          );
        }
        technicienId = row.id;
      }
    } else {
      // Nouvel email : création classique.
      await getAuth().api.signUpEmail({
        body: {
          email: trimmedEmail,
          password: tempPassword,
          name: trimmedName,
        },
      });

      const createdUser = await findAppUserByEmail(trimmedEmail);
      if (!createdUser) {
        return NextResponse.json(
          { error: "Une erreur est survenue." },
          { status: 500 },
        );
      }

      await updateAppUser(createdUser.id, {
        role: "admin",
        name: trimmedName,
        nom: trimmedName,
        phone: phone?.trim() || null,
        mustChangePassword: 1,
        archived: 0,
      });

      const row = await createTechnician({
        name: trimmedName,
        email: trimmedEmail,
        specialite,
        phone,
        notes,
        userId: createdUser.id,
      });
      if (!row) {
        return NextResponse.json(
          { error: "Une erreur est survenue." },
          { status: 500 },
        );
      }
      technicienId = row.id;
    }

    const technicien =
      (await getTechnicienDisplayById(technicienId)) ??
      formatTechnicienDisplay(null);

    if (!technicien) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    const baseUrl = (
      process.env.BETTER_AUTH_URL || "http://localhost:3000"
    ).replace(/\/$/, "");
    const mailResult = await sendTechnicianWelcomeEmail({
      to: trimmedEmail,
      name: trimmedName,
      email: trimmedEmail,
      tempPassword,
      loginUrl: `${baseUrl}/login`,
    });

    return NextResponse.json(
      {
        technicien,
        tempPassword,
        emailSent: mailResult.ok,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
