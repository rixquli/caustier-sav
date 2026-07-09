import { getDb, createNotification, notifyAdmins as notifyAdminsRaw } from "./db.js";
import { buildStatusChangeMessage } from "@/lib/notifications";
import type { TechnicienId } from "@/types/technicien";
import type {
  CreateDemandeInput,
  DemandeActivityRow,
  DemandeDisplay,
  DemandeId,
  DemandeRowJoined,
  LogDemandeActivityInput,
  UpdateDemandeInput,
} from "@/types/demande";

const DEMANDE_SELECT = `
  SELECT d.*,
         u.nom AS client_nom, u.prenom AS client_prenom, u.name AS client_name,
         u.email AS client_email, u.phone AS client_phone, u.adresse AS client_adresse,
         u.notes_admin AS client_notes_admin,
         a.name AS assignee_name,
         m.nom AS machine_nom
  FROM demandes d
  JOIN user u ON u.id = d.user_id
  LEFT JOIN techniciens a ON a.id = d.assigned_to
  LEFT JOIN machines m ON m.id = d.machine_id
`;

function parseDemandeId(id: DemandeId): number {
  return typeof id === "number" ? id : Number(id);
}

function notifyAdmins(params: {
  type: string;
  demandeId: number;
  message: string;
  excludeUserId?: string | null;
}): void {
  (notifyAdminsRaw as (input: typeof params) => void)(params);
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

export function touchDemandeActivity(demandeId: number): void {
  getDb()
    .prepare(
      "UPDATE demandes SET last_activity_at = datetime('now') WHERE id = ?",
    )
    .run(demandeId);
}

export function logActivity({
  demandeId,
  userId,
  action,
  details = null,
  isPublic = true,
}: LogDemandeActivityInput): void {
  getDb()
    .prepare(
      `INSERT INTO demande_activity (demande_id, user_id, action, details, is_public)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      demandeId,
      userId ?? null,
      action,
      details ? JSON.stringify(details) : null,
      isPublic ? 1 : 0,
    );
  touchDemandeActivity(demandeId);
}

export function listActivityForDemande(
  demandeId: number,
  publicOnly = false,
): DemandeActivityRow[] {
  const sql = publicOnly
    ? `SELECT a.*, u.nom AS user_nom, u.prenom AS user_prenom, u.name AS user_name, u.role AS user_role
       FROM demande_activity a
       LEFT JOIN user u ON u.id = a.user_id
       WHERE a.demande_id = ? AND a.is_public = 1
       ORDER BY a.created_at ASC`
    : `SELECT a.*, u.nom AS user_nom, u.prenom AS user_prenom, u.name AS user_name, u.role AS user_role
       FROM demande_activity a
       LEFT JOIN user u ON u.id = a.user_id
       WHERE a.demande_id = ?
       ORDER BY a.created_at ASC`;

  return getDb().prepare(sql).all(demandeId) as DemandeActivityRow[];
}

export function getDemandeById(
  id: DemandeId,
): DemandeRowJoined | undefined {
  return getDb()
    .prepare(`${DEMANDE_SELECT} WHERE d.id = ?`)
    .get(parseDemandeId(id)) as DemandeRowJoined | undefined;
}

export function listDemandesForUser(userId: string): DemandeRowJoined[] {
  return getDb()
    .prepare(
      `${DEMANDE_SELECT} WHERE d.user_id = ? ORDER BY d.created_at DESC`,
    )
    .all(userId) as DemandeRowJoined[];
}

export function listAllDemandes(): DemandeRowJoined[] {
  return getDb()
    .prepare(`${DEMANDE_SELECT} ORDER BY d.created_at DESC`)
    .all() as DemandeRowJoined[];
}

export function createDemande(input: CreateDemandeInput): DemandeRowJoined {
  const result = getDb()
    .prepare(
      `INSERT INTO demandes (user_id, machine_id, titre, description, type, priorite, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.userId,
      input.machineId ?? null,
      input.titre,
      input.description,
      input.type,
      input.priorite,
      input.assignedTo ?? null,
    );

  const demande = getDemandeById(result.lastInsertRowid as number);
  if (!demande) {
    throw new Error("Demande créée introuvable.");
  }

  logActivity({
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

  notifyAdmins({
    type: "nouvelle_demande",
    demandeId: demande.id,
    message: `Nouvelle demande #${demande.id} : ${input.titre}`,
    excludeUserId: input.actorId,
  });

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

  return normalized;
}

export function updateDemande(
  id: DemandeId,
  fields: UpdateDemandeInput,
  actorId: string | null,
  { skipNotifications = false }: { skipNotifications?: boolean } = {},
): DemandeRowJoined | null {
  const existing = getDemandeById(id);
  if (!existing) return null;

  const db = getDb();
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

  if (normalized.notes_admin !== undefined) {
    db.prepare("UPDATE demandes SET notes_admin = ? WHERE id = ?").run(
      typeof normalized.notes_admin === "string"
        ? normalized.notes_admin.trim() || null
        : normalized.notes_admin,
      parseDemandeId(id),
    );
  }

  if (normalized.status !== undefined) {
    if (normalized.status === "resolue" && existing.status !== "resolue") {
      db.prepare(
        "UPDATE demandes SET resolved_at = datetime('now') WHERE id = ?",
      ).run(parseDemandeId(id));
    }
    if (normalized.status === "fermee" && existing.status !== "fermee") {
      db.prepare(
        "UPDATE demandes SET closed_at = datetime('now') WHERE id = ?",
      ).run(parseDemandeId(id));
    }
  }

  if (Object.keys(updates).length > 0) {
    const sets = Object.keys(updates).map((k) => `${k} = ?`);
    const values = Object.values(updates);
    sets.push("last_activity_at = datetime('now')");
    values.push(parseDemandeId(id));
    db.prepare(`UPDATE demandes SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values,
    );

    if (updates.status) {
      logActivity({
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
        createNotification({
          userId: existing.user_id,
          type: "statut_change",
          demandeId: parseDemandeId(id),
          message: `Demande #${id} · ${buildStatusChangeMessage(existing.status, String(updates.status))}`,
        });
      }
    } else {
      logActivity({
        demandeId: parseDemandeId(id),
        userId: actorId,
        action: "field_update",
        details: updates,
        isPublic: true,
      });
    }
  }

  if (normalized.read_by_client !== undefined) {
    db.prepare("UPDATE demandes SET read_by_client = ? WHERE id = ?").run(
      normalized.read_by_client ? 1 : 0,
      parseDemandeId(id),
    );
  }

  if (normalized.read_by_admin !== undefined) {
    db.prepare("UPDATE demandes SET read_by_admin = ? WHERE id = ?").run(
      normalized.read_by_admin ? 1 : 0,
      parseDemandeId(id),
    );
  }

  return getDemandeById(id) ?? null;
}

export function deleteDemande(id: DemandeId): DemandeRowJoined | null {
  const existing = getDemandeById(id);
  if (!existing) return null;

  getDb()
    .prepare("DELETE FROM demandes WHERE id = ?")
    .run(parseDemandeId(id));

  return existing;
}

export function getRecentDemandes(
  limit = 10,
  userId: string | null = null,
): DemandeRowJoined[] {
  if (userId) {
    return getDb()
      .prepare(
        `${DEMANDE_SELECT} WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT ?`,
      )
      .all(userId, limit) as DemandeRowJoined[];
  }

  return getDb()
    .prepare(`${DEMANDE_SELECT} ORDER BY d.created_at DESC LIMIT ?`)
    .all(limit) as DemandeRowJoined[];
}

export function listDemandesForTechnician(
  technicianId: TechnicienId,
): DemandeDisplay[] {
  return (
    getDb()
      .prepare(`${DEMANDE_SELECT} WHERE d.assigned_to = ? ORDER BY d.created_at DESC`)
      .all(String(technicianId)) as DemandeRowJoined[]
  )
    .map((row) => formatDemandeDisplay(row))
    .filter((row): row is DemandeDisplay => row !== null);
}
