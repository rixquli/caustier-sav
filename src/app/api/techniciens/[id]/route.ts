import { NextResponse } from "next/server";
import {
  deleteTechnician,
  findTechnicianByEmail,
  getTechnicienDisplayById,
  getTechnicianById,
  updateTechnician,
} from "@/db/technicien";
import { findAppUserByEmail, updateAppUser, updateUserEmail } from "@/db/user";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type {
  ApiErrorResponse,
  DeleteTechnicienResponse,
  TechnicienDetailResponse,
  UpdateTechnicienRequest,
  UpdateTechnicienResponse,
} from "@/types/technicien";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<TechnicienDetailResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const technicien = await getTechnicienDisplayById(id);

  if (!technicien) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ technicien, machines: [] });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<UpdateTechnicienResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const existing = await getTechnicianById(id);

  if (!existing) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as UpdateTechnicienRequest;
    const { name, specialite, phone_number, email, notes_technicien, archived } =
      body;

    const nextEmail = email?.trim().toLowerCase();
    if (nextEmail && nextEmail !== existing.email.toLowerCase()) {
      const takenByUser = await findAppUserByEmail(nextEmail);
      if (takenByUser && takenByUser.id !== existing.user_id) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé." },
          { status: 409 },
        );
      }
      const takenByTech = await findTechnicianByEmail(nextEmail);
      if (takenByTech && takenByTech.id !== existing.id) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un technicien." },
          { status: 409 },
        );
      }
    }

    const updated = await updateTechnician(id, {
      name,
      specialite,
      phone_number,
      email: nextEmail,
      notes_technicien: notes_technicien ?? body.notes_admin ?? undefined,
    });

    if (existing.user_id) {
      if (nextEmail && nextEmail !== existing.email.toLowerCase()) {
        await updateUserEmail(existing.user_id, nextEmail);
      }
      await updateAppUser(existing.user_id, {
        ...(name !== undefined ? { name: name.trim(), nom: name.trim() } : {}),
        ...(phone_number !== undefined
          ? { phone: phone_number.trim() || null }
          : {}),
        ...(archived !== undefined ? { archived } : {}),
      });
    }

    const technicien = await getTechnicienDisplayById(updated?.id ?? id);

    if (!technicien) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ technicien });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<DeleteTechnicienResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const existing = await getTechnicienDisplayById(id);

  if (!existing) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  if (existing.userId) {
    await updateAppUser(existing.userId, { archived: true });
  }

  const deleted = await deleteTechnician(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    technicien: { ...existing, archived: true },
  });
}
