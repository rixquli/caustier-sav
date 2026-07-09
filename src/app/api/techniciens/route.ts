import { NextResponse } from "next/server";
import {
  createTechnician,
  formatTechnicienDisplay,
  listTechnicians,
} from "@/db/technicien";
import { getSessionUser, requireAdmin } from "@/lib/session";
import type {
  ApiErrorResponse,
  CreateTechnicienRequest,
  CreateTechnicienResponse,
  ListTechniciansResponse,
} from "@/types/technicien";

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

  const techniciens = (await listTechnicians({ search }))
    .map((row) => formatTechnicienDisplay(row))
    .filter((row): row is NonNullable<typeof row> => row !== null);

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

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nom et email obligatoires." },
        { status: 400 },
      );
    }

    const row = await createTechnician({ name, specialite, phone, email, notes });
    const technicien = formatTechnicienDisplay(row);

    if (!technicien) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ technicien }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}
