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
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import type {
  ApiErrorResponse,
  DeleteDemandeResponse,
  DemandeDetailResponse,
  UpdateDemandeRequest,
  UpdateDemandeResponse,
} from "@/types/demande";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse<DemandeDetailResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  const { id } = await params;
  const existing = await getDemandeById(Number(id));

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
    await updateDemande(existing.id, { readByAdmin: true }, user.id);
  } else {
    await updateDemande(existing.id, { readByClient: true }, user.id);
  }

  const demande = formatDemandeDisplay(await getDemandeById(existing.id));

  if (!demande) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    demande,
    messages: await listMessagesForDemande(existing.id),
    notes: isAdmin ? await listNotesForDemande(existing.id) : [],
    activity: await listActivityForDemande(existing.id, !isAdmin),
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<UpdateDemandeResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  const { id } = await params;
  const existing = await getDemandeById(Number(id));

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
    const updated = await updateDemande(
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
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const deleted = await deleteDemande(Number(id));

  if (!deleted) {
    return NextResponse.json(
      { error: "Demande introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
