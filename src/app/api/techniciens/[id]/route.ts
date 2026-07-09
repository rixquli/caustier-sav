import { NextResponse } from "next/server";
import { listMachinesForUser } from "@/db/db";
import {
  deleteTechnician,
  formatTechnicienDisplay,
  getTechnicianById,
  updateTechnician,
} from "@/db/technicien";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type {
  ApiErrorResponse,
  DeleteTechnicienResponse,
  TechnicienDetailResponse,
  TechnicienMachineSummary,
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
  const technicien = formatTechnicienDisplay(getTechnicianById(id));

  if (!technicien) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  const machines = listMachinesForUser(id) as TechnicienMachineSummary[];

  return NextResponse.json({ technicien, machines });
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
  const existing = getTechnicianById(id);

  if (!existing) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as UpdateTechnicienRequest;
    const { name, specialite, phone_number, email, notes_technicien } = body;

    const updated = updateTechnician(id, {
      name,
      specialite,
      phone_number,
      email,
      notes_technicien:
        notes_technicien ?? body.notes_admin ?? undefined,
    });

    const technicien = formatTechnicienDisplay(updated);

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
  const deleted = deleteTechnician(id);
  const technicien = formatTechnicienDisplay(deleted);

  if (!technicien) {
    return NextResponse.json(
      { error: "Technicien introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ technicien });
}
