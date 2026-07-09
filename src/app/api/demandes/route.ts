import { NextResponse } from "next/server";
import {
  createDemande,
  findAppUserById,
  formatDemandeDisplay,
  getDemandeById,
  getTechnicianById,
  getTechnicianBySpecialite,
  listAllDemandes,
  listDemandesForUser,
  logActivity,
} from "@/db/db";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import { sendMessage } from "@/lib/whatsapp/send";
import type {
  ApiErrorResponse,
  CreateDemandeRequest,
  CreateDemandeResponse,
  ListDemandesResponse,
} from "@/types/demande";

export async function GET(): Promise<
  NextResponse<ListDemandesResponse | ApiErrorResponse>
> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error.error },
      { status: auth.error.status },
    );
  }
  const user = auth.user;

  const rows =
    user.role === "admin"
      ? await listAllDemandes()
      : await listDemandesForUser(user.id);

  const demandes = rows
    .map((row) => formatDemandeDisplay(row))
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return NextResponse.json({ demandes });
}

export async function POST(
  request: Request,
): Promise<NextResponse<CreateDemandeResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error.error },
      { status: auth.error.status },
    );
  }
  const user = auth.user;

  try {
    const body = (await request.json()) as CreateDemandeRequest;
    const {
      titre,
      description,
      type,
      priorite,
      machineId,
      userId,
      assignedTo,
    } = body;

    if (!titre?.trim() || !description?.trim() || !type || !priorite) {
      return NextResponse.json(
        { error: "Titre, description, type et priorité sont obligatoires." },
        { status: 400 },
      );
    }

    let targetUserId = user.id;

    if (user.role === "admin") {
      if (!userId) {
        return NextResponse.json(
          { error: "Sélectionnez un client." },
          { status: 400 },
        );
      }
      const client = await findAppUserById(userId);
      if (!client || client.role !== "client") {
        return NextResponse.json(
          { error: "Client invalide." },
          { status: 400 },
        );
      }
      targetUserId = client.id;
    }

    const row = await createDemande({
      userId: targetUserId,
      machineId: machineId ? Number(machineId) : null,
      titre: titre.trim(),
      description: description.trim(),
      type,
      priorite,
      assignedTo: assignedTo || null,
      actorId: user.id,
    });

    const technician = assignedTo
      ? await getTechnicianById(assignedTo)
      : await getTechnicianBySpecialite(type);

    const client = userId ? await findAppUserById(userId) : null;

    try {
      sendMessage({
        technicianNumber: technician?.telephone ?? "0672651376",
        technicianName: technician?.name ?? "John Doe",
        clientName: client?.name ?? "John Doe",
        description: description ?? "Description de la demande",
        type: type ?? "IA",
        priority: priorite ?? "Normal",
      }).then(() => {
        void logActivity({
          demandeId: row.id,
          userId: null,
          action: "whatsapp_message_sent",
          details: {
            technicianName: technician?.name ?? "John Doe",
            technicianNumber: technician?.telephone ?? "0672651376",
            clientName: client?.name ?? "John Doe",
            description: description ?? "Description de la demande",
            type: type ?? "IA",
            priority: priorite ?? "Normal",
          },
          isPublic: true,
        });
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi du message" },
        { status: 500 },
      );
    }

    const demande = formatDemandeDisplay(await getDemandeById(row.id));

    if (!demande) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ demande }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Une erreur est survenue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
