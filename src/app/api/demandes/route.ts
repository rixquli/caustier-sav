import { NextResponse } from "next/server";
import {
  createDemande,
  findAppUserById,
  formatDemandeDisplay,
  getDemandeById,
  getTechnicianById,
  getTechnicianBySpecialite,
  listAllDemandes,
  listAllDemandesPaginated,
  listDemandesForUser,
  listDemandesForUserPaginated,
} from "@/db/db";
import { parsePaginationQuery } from "@/lib/pagination";
import { getSessionUser, guardUser } from "@/lib/session";
import { logApiError } from "@/lib/log-api-error";
import type {
  ApiErrorResponse,
  CreateDemandeRequest,
  CreateDemandeResponse,
  ListDemandesResponse,
} from "@/types/demande";

export async function GET(
  request: Request,
): Promise<NextResponse<ListDemandesResponse | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error.error },
      { status: auth.error.status },
    );
  }
  const user = auth.user;

  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationQuery(
    searchParams.get("page"),
    searchParams.get("limit"),
  );

  if (pagination) {
    const result =
      user.role === "admin"
        ? await listAllDemandesPaginated(pagination.page, pagination.limit)
        : await listDemandesForUserPaginated(
            user.id,
            pagination.page,
            pagination.limit,
          );

    const demandes = result.rows
      .map((row) => formatDemandeDisplay(row))
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return NextResponse.json({ demandes, pagination: result.pagination });
  }

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

    const technician = assignedTo
      ? await getTechnicianById(assignedTo)
      : await getTechnicianBySpecialite(type);

    const row = await createDemande({
      userId: targetUserId,
      machineId: machineId ? Number(machineId) : null,
      titre: titre.trim(),
      description: description.trim(),
      type,
      priorite,
      assignedTo: assignedTo ?? (technician ? String(technician.id) : null),
      actorId: user.id,
    });

    const demande = formatDemandeDisplay(await getDemandeById(row.id));

    if (!demande) {
      return NextResponse.json(
        { error: "Une erreur est survenue." },
        { status: 500 },
      );
    }

    return NextResponse.json({ demande }, { status: 201 });
  } catch (error) {
    logApiError("/api/demandes", error, { method: "POST" });
    const message =
      error instanceof Error ? error.message : "Une erreur est survenue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
