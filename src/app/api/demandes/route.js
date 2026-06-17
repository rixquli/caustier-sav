import { NextResponse } from "next/server";
import {
  createDemande,
  findAppUserById,
  getDemandeById,
  listAllDemandes,
  listDemandesForUser,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const demandes =
    user.role === "admin"
      ? listAllDemandes()
      : listDemandesForUser(user.id);

  return NextResponse.json({ demandes });
}

export async function POST(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await request.json();
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
        return NextResponse.json({ error: "Sélectionnez un client." }, { status: 400 });
      }
      const client = findAppUserById(userId);
      if (!client || client.role !== "client") {
        return NextResponse.json({ error: "Client invalide." }, { status: 400 });
      }
      targetUserId = client.id;
    }

    const demande = createDemande({
      userId: targetUserId,
      machineId: machineId ? Number(machineId) : null,
      titre: titre.trim(),
      description: description.trim(),
      type,
      priorite,
      assignedTo: assignedTo || null,
      actorId: user.id,
    });

    return NextResponse.json({ demande: getDemandeById(demande.id) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
