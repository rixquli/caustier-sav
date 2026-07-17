import { prisma } from "@/lib/prisma";
import { buildPaginationMeta } from "@/lib/pagination";
import { createNotification, notifyAdmins as notifyAdminsRaw } from "./notifications";
import {
  buildStatusChangeMessage,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import { sendAssignmentEmail } from "@/lib/mail";
import { parseOptionalInt, toBoolFlag, toIsoString, toIsoStringOrNull } from "./helpers";
import { getTechnicianById } from "./technicien";
import type { TechnicienId } from "@/types/technicien";
import type {
  CreateDemandeInput,
  DemandeActivityRow,
  DemandeDisplay,
  DemandeId,
  DemandeListResult,
  DemandeRowJoined,
  LogDemandeActivityInput,
  UpdateDemandeInput,
} from "@/types/demande";
import type { Prisma } from "@/generated/prisma/client";

const demandeInclude = {
  user: {
    select: {
      nom: true,
      prenom: true,
      name: true,
      email: true,
      phone: true,
      adresse: true,
      notes_admin: true,
    },
  },
  technicien: { select: { name: true } },
  machine: { select: { nom: true } },
} satisfies Prisma.DemandeInclude;

type DemandeWithJoins = Prisma.DemandeGetPayload<{
  include: typeof demandeInclude;
}>;

function parseDemandeId(id: DemandeId): number {
  return typeof id === "number" ? id : Number(id);
}

async function notifyAdmins(params: {
  type: string;
  demandeId: number;
  message: string;
  excludeUserId?: string | null;
  excludeUserIds?: string[];
}): Promise<void> {
  await notifyAdminsRaw(params);
}

function isSelfAssignment(
  actorId: string | null | undefined,
  tech:
    | { user_id?: string | null; userId?: string | null }
    | null
    | undefined,
): boolean {
  if (!actorId || !tech) return false;
  const techUserId = tech.user_id ?? tech.userId ?? null;
  return Boolean(techUserId && actorId === techUserId);
}

/** Notifie le compte User lié + email si pas de téléphone. */
async function notifyAssigneeOnAssignment({
  demandeId,
  titre,
  assignedTo,
  actorId,
}: {
  demandeId: number;
  titre: string;
  assignedTo: string | number | null | undefined;
  actorId?: string | null;
}): Promise<void> {
  const techId = parseOptionalInt(assignedTo ?? null);
  if (techId == null) return;

  const tech = await getTechnicianById(techId);
  if (!tech) return;
  if (actorId && tech.user_id && actorId === tech.user_id) return;

  const message = `Une demande vous a été proposée : « ${titre} »`;

  if (tech.user_id) {
    await createNotification({
      userId: tech.user_id,
      type: NOTIFICATION_TYPES.DEMANDE_ASSIGNEE,
      demandeId,
      message,
    });
  }

  const hasPhone = Boolean(tech.telephone?.trim());
  const email = tech.email?.trim();
  if (!hasPhone && email) {
    const baseUrl = (
      process.env.BETTER_AUTH_URL || "http://localhost:3000"
    ).replace(/\/$/, "");
    const mailResult = await sendAssignmentEmail({
      to: email,
      name: tech.name,
      titre,
      demandeId,
      demandeUrl: `${baseUrl}/admin/demandes/${demandeId}`,
    });
    if (!mailResult.ok) {
      console.error(
        "[notifyAssigneeOnAssignment] email failed:",
        mailResult.error,
      );
    }
  }
}

function mapDemandeRowJoined(row: DemandeWithJoins): DemandeRowJoined {
  return {
    id: row.id,
    user_id: row.userId,
    machine_id: row.machineId,
    titre: row.titre,
    description: row.description,
    type: row.type,
    priorite: row.priorite,
    status: row.status,
    assigned_to: row.assignedTo != null ? String(row.assignedTo) : null,
    created_at: toIsoString(row.created_at),
    last_activity_at: toIsoString(row.last_activity_at),
    resolved_at: toIsoStringOrNull(row.resolved_at),
    closed_at: toIsoStringOrNull(row.closed_at),
    read_by_client: toBoolFlag(row.read_by_client),
    read_by_admin: toBoolFlag(row.read_by_admin),
    notes_admin: row.notes_admin,
    closed_message: row.closed_message,
    client_nom: row.user.nom,
    client_prenom: row.user.prenom,
    client_name: row.user.name,
    client_email: row.user.email,
    client_phone: row.user.phone,
    client_adresse: row.user.adresse,
    client_notes_admin: row.user.notes_admin,
    assignee_name: row.technicien?.name ?? null,
    machine_nom: row.machine?.nom ?? null,
  };
}

export function formatDemandeDisplay(
  row: DemandeRowJoined | null | undefined,
): DemandeDisplay | null {
  if (!row) return null;

  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    type: row.type,
    priorite: row.priorite,
    status: row.status,
    notes_admin: row.notes_admin,
    notesAdmin: row.notes_admin,
    closedMessage: row.closed_message,
    closed_message: row.closed_message,
    client_nom: row.client_nom,
    client_prenom: row.client_prenom,
    client_name: row.client_name,
    client_email: row.client_email,
    client_phone: row.client_phone,
    client_adresse: row.client_adresse,
    client_notes_admin: row.client_notes_admin,
    assignee_name: row.assignee_name,
    machine_nom: row.machine_nom,
    userId: row.user_id,
    user_id: row.user_id,
    machineId: row.machine_id,
    machine_id: row.machine_id,
    assignedTo: row.assigned_to,
    assigned_to: row.assigned_to,
    createdAt: row.created_at,
    created_at: row.created_at,
    lastActivityAt: row.last_activity_at,
    last_activity_at: row.last_activity_at,
    resolvedAt: row.resolved_at,
    resolved_at: row.resolved_at,
    closedAt: row.closed_at,
    closed_at: row.closed_at,
    readByClient: row.read_by_client === 1,
    readByAdmin: row.read_by_admin === 1,
  };
}

export async function touchDemandeActivity(demandeId: number): Promise<void> {
  await prisma.demande.update({
    where: { id: demandeId },
    data: { last_activity_at: new Date() },
  });
}

export async function logActivity({
  demandeId,
  userId,
  action,
  details = null,
  isPublic = true,
}: LogDemandeActivityInput): Promise<void> {
  await prisma.demandeActivity.create({
    data: {
      demandeId,
      userId: userId ?? null,
      action,
      details: details ? JSON.stringify(details) : null,
      is_public: isPublic,
    },
  });
  await touchDemandeActivity(demandeId);
}

export async function getRefusedTechnicianIdsForDemande(
  demandeId: number,
): Promise<number[]> {
  const activities = await prisma.demandeActivity.findMany({
    where: { demandeId, action: "whatsapp_technician_refused" },
    select: { details: true },
  });

  const ids = new Set<number>();
  for (const activity of activities) {
    if (!activity.details) continue;
    try {
      const details = JSON.parse(activity.details) as {
        technicianId?: number;
      };
      if (details.technicianId != null) {
        ids.add(details.technicianId);
      }
    } catch {
      // ignore malformed activity payloads
    }
  }

  return [...ids];
}

export type TechnicianWhatsappResponse = "accepted" | "refused";

export async function getTechnicianWhatsappResponseForDemande(
  demandeId: number,
  technicianId: TechnicienId,
): Promise<TechnicianWhatsappResponse | null> {
  const techId = parseOptionalInt(technicianId);
  if (techId == null) return null;

  const activities = await prisma.demandeActivity.findMany({
    where: {
      demandeId,
      action: {
        in: ["whatsapp_technician_accepted", "whatsapp_technician_refused"],
      },
    },
    select: { action: true, details: true },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });

  for (const activity of activities) {
    if (!activity.details) continue;
    try {
      const details = JSON.parse(activity.details) as {
        technicianId?: number;
      };
      if (details.technicianId !== techId) continue;
      return activity.action === "whatsapp_technician_accepted"
        ? "accepted"
        : "refused";
    } catch {
      // ignore malformed activity payloads
    }
  }

  return null;
}

export async function findPendingWhatsappDemandeForTechnician(
  technicianId: TechnicienId,
): Promise<DemandeRowJoined | undefined> {
  const techId = parseOptionalInt(technicianId);
  if (techId == null) return undefined;

  const sentActivities = await prisma.demandeActivity.findMany({
    where: { action: "whatsapp_message_sent" },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    select: { demandeId: true, details: true },
  });

  for (const activity of sentActivities) {
    if (!activity.details) continue;

    let details: { technicianId?: number };
    try {
      details = JSON.parse(activity.details) as { technicianId?: number };
    } catch {
      continue;
    }

    if (details.technicianId !== techId) continue;

    const prior = await getTechnicianWhatsappResponseForDemande(
      activity.demandeId,
      techId,
    );
    if (prior) continue;

    const demande = await getDemandeById(activity.demandeId);
    if (!demande) continue;
    if (demande.status !== "nouvelle") continue;
    if (String(demande.assigned_to) !== String(techId)) continue;

    return demande;
  }

  return undefined;
}

export async function resolveDemandeForTechnicianWhatsappReply(
  technicianId: TechnicienId,
  demandeId: DemandeId,
): Promise<DemandeRowJoined | undefined> {
  const techId = parseOptionalInt(technicianId);
  if (techId == null) return undefined;

  const demande = await getDemandeById(demandeId);
  if (!demande) return undefined;
  if (demande.status !== "nouvelle") return undefined;
  if (String(demande.assigned_to) !== String(techId)) return undefined;

  const prior = await getTechnicianWhatsappResponseForDemande(demande.id, techId);
  if (prior) return undefined;

  return demande;
}

export async function listActivityForDemande(
  demandeId: number,
  publicOnly = false,
): Promise<DemandeActivityRow[]> {
  const rows = await prisma.demandeActivity.findMany({
    where: {
      demandeId,
      ...(publicOnly ? { is_public: true } : {}),
    },
    include: {
      user: {
        select: { nom: true, prenom: true, name: true, role: true },
      },
    },
    orderBy: [{ created_at: "asc" }, { id: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    demande_id: row.demandeId,
    user_id: row.userId,
    action: row.action,
    details: row.details,
    is_public: toBoolFlag(row.is_public),
    created_at: toIsoString(row.created_at),
    user_nom: row.user?.nom ?? null,
    user_prenom: row.user?.prenom ?? null,
    user_name: row.user?.name ?? null,
    user_role: row.user?.role ?? null,
  }));
}

export async function getDemandeById(
  id: DemandeId,
): Promise<DemandeRowJoined | undefined> {
  const row = await prisma.demande.findUnique({
    where: { id: parseDemandeId(id) },
    include: demandeInclude,
  });
  return row ? mapDemandeRowJoined(row) : undefined;
}

export async function listDemandesForUser(
  userId: string,
): Promise<DemandeRowJoined[]> {
  const rows = await prisma.demande.findMany({
    where: { userId },
    include: demandeInclude,
    orderBy: { created_at: "desc" },
  });
  return rows.map(mapDemandeRowJoined);
}

export async function listDemandesForUserPaginated(
  userId: string,
  page: number,
  limit: number,
): Promise<DemandeListResult> {
  const skip = (page - 1) * limit;
  const where = { userId };

  const [total, rows] = await Promise.all([
    prisma.demande.count({ where }),
    prisma.demande.findMany({
      where,
      include: demandeInclude,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    rows: rows.map(mapDemandeRowJoined),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function listAllDemandes(): Promise<DemandeRowJoined[]> {
  const rows = await prisma.demande.findMany({
    include: demandeInclude,
    orderBy: { created_at: "desc" },
  });
  return rows.map(mapDemandeRowJoined);
}

export async function listAllDemandesPaginated(
  page: number,
  limit: number,
): Promise<DemandeListResult> {
  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    prisma.demande.count(),
    prisma.demande.findMany({
      include: demandeInclude,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    rows: rows.map(mapDemandeRowJoined),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function createDemande(
  input: CreateDemandeInput,
): Promise<DemandeRowJoined> {
  const created = await prisma.demande.create({
    data: {
      userId: input.userId,
      machineId: input.machineId ?? null,
      titre: input.titre,
      description: input.description,
      type: input.type,
      priorite: input.priorite,
      assignedTo: parseOptionalInt(input.assignedTo ?? null),
    },
    include: demandeInclude,
  });

  const demande = mapDemandeRowJoined(created);

  await logActivity({
    demandeId: demande.id,
    userId: input.actorId ?? null,
    action: "creation",
    details: {
      titre: input.titre,
      type: input.type,
      priorite: input.priorite,
    },
    isPublic: true,
  });

  const assigneeTech =
    demande.assigned_to != null
      ? await getTechnicianById(demande.assigned_to)
      : null;
  const assigneeUserId = assigneeTech?.user_id ?? null;

  await notifyAdmins({
    type: "nouvelle_demande",
    demandeId: demande.id,
    message: `Nouvelle demande #${demande.id} : ${input.titre}`,
    excludeUserId: input.actorId,
    excludeUserIds: assigneeUserId ? [assigneeUserId] : [],
  });

  if (demande.assigned_to != null && assigneeTech) {
    const selfAssign = isSelfAssignment(input.actorId, assigneeTech);

    await notifyAssigneeOnAssignment({
      demandeId: demande.id,
      titre: demande.titre,
      assignedTo: demande.assigned_to,
      actorId: input.actorId,
    });

    const { offerDemandeToTechnician, deliverClientContactToTechnician } =
      await import("@/lib/whatsapp/offer");

    if (selfAssign) {
      await deliverClientContactToTechnician({
        demande,
        technician: assigneeTech,
        reason: "self_assign",
      });
    } else {
      await offerDemandeToTechnician({
        demandeId: demande.id,
        technician: assigneeTech,
        clientName: demande.client_name ?? "Client",
        description: demande.description,
        type: demande.type,
        priority: demande.priorite,
        titre: demande.titre,
        activityDetails: { initialNotification: true },
      });
    }
  }

  return demande;
}

function normalizeUpdateFields(
  fields: UpdateDemandeInput,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...fields };

  if (fields.assignedTo !== undefined) {
    normalized.assigned_to = fields.assignedTo;
    delete normalized.assignedTo;
  }
  if (fields.machineId !== undefined) {
    normalized.machine_id = fields.machineId;
    delete normalized.machineId;
  }
  if (fields.userId !== undefined) {
    normalized.user_id = fields.userId;
    delete normalized.userId;
  }
  if (fields.notesAdmin !== undefined) {
    normalized.notes_admin = fields.notesAdmin;
    delete normalized.notesAdmin;
  }
  if (fields.readByClient !== undefined) {
    normalized.read_by_client = fields.readByClient;
    delete normalized.readByClient;
  }
  if (fields.readByAdmin !== undefined) {
    normalized.read_by_admin = fields.readByAdmin;
    delete normalized.readByAdmin;
  }
  if (fields.closedMessage !== undefined) {
    normalized.closed_message = fields.closedMessage;
    delete normalized.closedMessage;
  }

  return normalized;
}

export async function updateDemande(
  id: DemandeId,
  fields: UpdateDemandeInput,
  actorId: string | null,
  {
    skipNotifications = false,
    skipActivityLog = false,
  }: { skipNotifications?: boolean; skipActivityLog?: boolean } = {},
): Promise<DemandeRowJoined | null> {
  const existing = await getDemandeById(id);
  if (!existing) return null;

  const normalized = normalizeUpdateFields(fields);
  const updates: Record<string, unknown> = {};
  const trackFields = [
    "titre",
    "description",
    "type",
    "priorite",
    "status",
    "assigned_to",
    "machine_id",
    "user_id",
  ] as const;

  for (const key of trackFields) {
    if (
      normalized[key] !== undefined &&
      normalized[key] !== existing[key as keyof DemandeRowJoined]
    ) {
      updates[key] = normalized[key];
    }
  }

  const data: Prisma.DemandeUncheckedUpdateInput = {};

  if (normalized.notes_admin !== undefined) {
    data.notes_admin =
      typeof normalized.notes_admin === "string"
        ? normalized.notes_admin.trim() || null
        : (normalized.notes_admin as string | null);
  }

  if (normalized.closed_message !== undefined) {
    data.closed_message =
      typeof normalized.closed_message === "string"
        ? normalized.closed_message.trim() || null
        : (normalized.closed_message as string | null);
  }

  if (normalized.status !== undefined) {
    data.status = String(normalized.status);
    if (normalized.status === "resolue" && existing.status !== "resolue") {
      data.resolved_at = new Date();
    }
    if (normalized.status === "fermee" && existing.status !== "fermee") {
      data.closed_at = new Date();
    }
  }

  if (updates.titre !== undefined) data.titre = String(updates.titre);
  if (updates.description !== undefined) {
    data.description = String(updates.description);
  }
  if (updates.type !== undefined) data.type = String(updates.type);
  if (updates.priorite !== undefined) data.priorite = String(updates.priorite);
  if (updates.status !== undefined) data.status = String(updates.status);
  if (updates.machine_id !== undefined) {
    data.machineId = updates.machine_id as number | null;
  }
  if (updates.user_id !== undefined) {
    data.userId = String(updates.user_id);
  }
  if (updates.assigned_to !== undefined) {
    data.assignedTo = parseOptionalInt(
      updates.assigned_to as string | number | null,
    );
  }

  if (Object.keys(updates).length > 0) {
    data.last_activity_at = new Date();
  }

  if (normalized.read_by_client !== undefined) {
    data.read_by_client = Boolean(normalized.read_by_client);
  }
  if (normalized.read_by_admin !== undefined) {
    data.read_by_admin = Boolean(normalized.read_by_admin);
  }

  if (Object.keys(data).length > 0) {
    await prisma.demande.update({
      where: { id: parseDemandeId(id) },
      data,
    });
  }

  if (Object.keys(updates).length > 0 && !skipActivityLog) {
    if (updates.status) {
      await logActivity({
        demandeId: parseDemandeId(id),
        userId: actorId,
        action: "status_change",
        details: {
          from: existing.status,
          to: updates.status,
        },
        isPublic: true,
      });

      if (!skipNotifications) {
        await createNotification({
          userId: existing.user_id,
          type: "statut_change",
          demandeId: parseDemandeId(id),
          message: `Demande #${id} · ${buildStatusChangeMessage(existing.status, String(updates.status))}`,
        });
      }
    } else {
      await logActivity({
        demandeId: parseDemandeId(id),
        userId: actorId,
        action: "field_update",
        details: updates,
        isPublic: true,
      });
    }
  }

  if (
    !skipNotifications &&
    updates.assigned_to !== undefined &&
    updates.assigned_to != null
  ) {
    const assignedTo = updates.assigned_to as string | number;
    const tech = await getTechnicianById(assignedTo);
    const selfAssign = isSelfAssignment(actorId, tech);

    await notifyAssigneeOnAssignment({
      demandeId: parseDemandeId(id),
      titre:
        typeof updates.titre === "string" ? updates.titre : existing.titre,
      assignedTo,
      actorId,
    });

    const updatedDemande = (await getDemandeById(id)) ?? existing;

    if (tech) {
      const { offerDemandeToTechnician, deliverClientContactToTechnician } =
        await import("@/lib/whatsapp/offer");

      if (selfAssign) {
        await deliverClientContactToTechnician({
          demande: updatedDemande,
          technician: tech,
          reason: "self_assign",
        });
      } else {
        await offerDemandeToTechnician({
          demandeId: parseDemandeId(id),
          technician: tech,
          clientName: updatedDemande.client_name ?? "Client",
          description: updatedDemande.description,
          type: updatedDemande.type,
          priority: updatedDemande.priorite,
          titre: updatedDemande.titre,
          activityDetails: { reassignedByAdmin: true },
        });
      }
    }
  }

  return (await getDemandeById(id)) ?? null;
}

export async function deleteDemande(
  id: DemandeId,
): Promise<DemandeRowJoined | null> {
  const existing = await getDemandeById(id);
  if (!existing) return null;

  await prisma.demande.delete({
    where: { id: parseDemandeId(id) },
  });

  return existing;
}

export async function getRecentDemandes(
  limit = 10,
  userId: string | null = null,
): Promise<DemandeRowJoined[]> {
  const rows = await prisma.demande.findMany({
    where: userId ? { userId } : undefined,
    include: demandeInclude,
    orderBy: { created_at: "desc" },
    take: limit,
  });
  return rows.map(mapDemandeRowJoined);
}

export async function findAwaitingTechnicianResponse(
  technicianId: TechnicienId,
): Promise<DemandeRowJoined | undefined> {
  const techId = parseOptionalInt(technicianId);
  if (techId == null) return undefined;

  const assigned = await prisma.demande.findFirst({
    where: { assignedTo: techId, status: "nouvelle" },
    include: demandeInclude,
    orderBy: { created_at: "desc" },
  });
  if (assigned) {
    console.log("[WhatsApp Webhook] Demande assignée trouvée", {
      demandeId: assigned.id,
      technicianId: techId,
    });
    return mapDemandeRowJoined(assigned);
  }

  const technician = await prisma.technicien.findUnique({
    where: { id: techId },
    select: { specialite: true },
  });
  if (!technician?.specialite) {
    console.log("[WhatsApp Webhook] Pas de spécialité pour technicien", {
      technicianId: techId,
    });
    return undefined;
  }

  const bySpecialite = await prisma.demande.findFirst({
    where: {
      assignedTo: null,
      status: "nouvelle",
      type: technician.specialite,
    },
    include: demandeInclude,
    orderBy: { created_at: "desc" },
  });

  if (bySpecialite) {
    console.log("[WhatsApp Webhook] Demande par spécialité trouvée", {
      demandeId: bySpecialite.id,
      type: bySpecialite.type,
      specialite: technician.specialite,
    });
    return mapDemandeRowJoined(bySpecialite);
  }

  console.log("[WhatsApp Webhook] Aucune demande nouvelle", {
    technicianId: techId,
    specialite: technician.specialite,
  });
  return undefined;
}

export async function listDemandesForTechnician(
  technicianId: TechnicienId,
): Promise<DemandeDisplay[]> {
  const rows = await prisma.demande.findMany({
    where: { assignedTo: parseOptionalInt(technicianId) ?? undefined },
    include: demandeInclude,
    orderBy: { created_at: "desc" },
  });

  return rows
    .map((row) => formatDemandeDisplay(mapDemandeRowJoined(row)))
    .filter((row): row is DemandeDisplay => row !== null);
}
