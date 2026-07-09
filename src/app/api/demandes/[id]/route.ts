import { NextResponse } from "next/server";
import {
  deleteDemande,
  formatDemandeDisplay,
  getDemandeById,
  listActivityForDemande,
  listMessagesForDemande,
  listNotesForDemande,
  updateDemande,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";
import type {
  ApiErrorResponse,
  DeleteDemandeResponse,
  DemandeDetailResponse,
  UpdateDemandeRequest,
  UpdateDemandeResponse,
} from "@/types/demande";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<DemandeDetailResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const existing = getDemandeById(Number(id));

  if (!existing) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  if (user.role !== "admin" && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const isAdmin = user.role === "admin";

  if (isAdmin) {
    updateDemande(existing.id, { readByAdmin: true }, user.id);
  } else {
    updateDemande(existing.id, { readByClient: true }, user.id);
  }

  const demande = formatDemandeDisplay(getDemandeById(existing.id));

  if (!demande) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    demande,
    messages: listMessagesForDemande(existing.id),
    notes: isAdmin ? listNotesForDemande(existing.id) : [],
    activity: listActivityForDemande(existing.id, !isAdmin),
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<UpdateDemandeResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { id } = await params;
  const existing = getDemandeById(Number(id));

  if (!existing) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as UpdateDemandeRequest;
    const updated = updateDemande(
      existing.id,
      {
        titre: body.titre,
        description: body.description,
        type: body.type,
        priorite: body.priorite,
        status: body.status,
        assignedTo: body.assignedTo ?? body.assigned_to,
        machineId: body.machineId ?? body.machine_id,
        userId: body.userId ?? body.user_id,
        notesAdmin: body.notes_admin ?? body.notesAdmin,
      },
      user.id,
    );

    const demande = formatDemandeDisplay(updated);

    if (!demande) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ demande });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<DeleteDemandeResponse | ApiErrorResponse>> {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const deleted = deleteDemande(Number(id));

  if (!deleted) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
